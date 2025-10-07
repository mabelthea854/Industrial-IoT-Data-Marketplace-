;; Industrial IoT Data Marketplace - Sell Machine Sensor Data
;; A decentralized marketplace for buying and selling industrial IoT sensor data

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u200))
(define-constant err-not-found (err u201))
(define-constant err-already-exists (err u202))
(define-constant err-unauthorized (err u203))
(define-constant err-insufficient-payment (err u204))
(define-constant err-data-expired (err u205))
(define-constant err-invalid-input (err u206))
(define-constant err-data-not-active (err u207))
(define-constant err-already-purchased (err u208))
(define-constant err-invalid-quality-score (err u209))

;; Data Variables
(define-data-var platform-fee-percentage uint u3) ;; 3% platform fee
(define-data-var min-data-price uint u10000) ;; Minimum price: 0.00001 STX

;; Data Maps

;; Store IoT data provider information
(define-map data-providers
    { provider: principal }
    {
        company-name: (string-utf8 100),
        verified: bool,
        total-datasets: uint,
        total-revenue: uint,
        reputation-score: uint, ;; 0-100
        active: bool
    }
)

;; Store sensor data listings
(define-map sensor-data-listings
    { data-id: uint }
    {
        provider: principal,
        machine-type: (string-utf8 50),
        sensor-type: (string-utf8 50),
        data-hash: (string-ascii 64), ;; IPFS or storage hash
        description: (string-utf8 500),
        price: uint,
        data-format: (string-ascii 20), ;; JSON, CSV, XML, etc.
        sampling-rate: uint, ;; Hz
        duration: uint, ;; seconds
        timestamp: uint, ;; block height when data was created
        expiry: uint, ;; block height when data expires
        quality-score: uint, ;; 0-100
        total-purchases: uint,
        active: bool,
        category: (string-utf8 50)
    }
)

;; Track data purchases
(define-map data-purchases
    { data-id: uint, buyer: principal }
    {
        purchase-block: uint,
        price-paid: uint,
        access-granted: bool,
        rating: (optional uint), ;; 0-5 stars
        review: (optional (string-utf8 200))
    }
)

;; Store access keys (encrypted off-chain, hash stored on-chain)
(define-map access-keys
    { data-id: uint, buyer: principal }
    {
        key-hash: (string-ascii 64),
        granted-block: uint,
        expires-block: uint
    }
)

;; Data subscriptions for recurring access
(define-map subscriptions
    { subscription-id: uint }
    {
        provider: principal,
        subscriber: principal,
        data-category: (string-utf8 50),
        price-per-period: uint,
        period-blocks: uint, ;; blocks per billing period
        start-block: uint,
        end-block: uint,
        auto-renew: bool,
        active: bool
    }
)

;; Counter variables
(define-data-var next-data-id uint u1)
(define-data-var next-subscription-id uint u1)

;; Read-only functions

(define-read-only (get-data-provider (provider principal))
    (map-get? data-providers { provider: provider })
)

(define-read-only (get-sensor-data-listing (data-id uint))
    (map-get? sensor-data-listings { data-id: data-id })
)

(define-read-only (get-data-purchase (data-id uint) (buyer principal))
    (map-get? data-purchases { data-id: data-id, buyer: buyer })
)

(define-read-only (get-access-key (data-id uint) (buyer principal))
    (map-get? access-keys { data-id: data-id, buyer: buyer })
)

(define-read-only (get-subscription (subscription-id uint))
    (map-get? subscriptions { subscription-id: subscription-id })
)

(define-read-only (get-platform-fee-percentage)
    (ok (var-get platform-fee-percentage))
)

(define-read-only (get-min-data-price)
    (ok (var-get min-data-price))
)

(define-read-only (check-data-access (data-id uint) (buyer principal))
    (let (
        (purchase-data (map-get? data-purchases { data-id: data-id, buyer: buyer }))
    )
        (ok (is-some purchase-data))
    )
)

(define-read-only (calculate-purchase-amounts (price uint))
    (let (
        (platform-fee (/ (* price (var-get platform-fee-percentage)) u100))
        (provider-amount (- price platform-fee))
    )
        (ok {
            total: price,
            platform-fee: platform-fee,
            provider-amount: provider-amount
        })
    )
)

;; Public functions

;; Register as a data provider
(define-public (register-provider (company-name (string-utf8 100)))
    (let (
        (existing-provider (map-get? data-providers { provider: tx-sender }))
    )
        (asserts! (is-none existing-provider) err-already-exists)
        (map-set data-providers
            { provider: tx-sender }
            {
                company-name: company-name,
                verified: false,
                total-datasets: u0,
                total-revenue: u0,
                reputation-score: u50, ;; Start with neutral score
                active: true
            }
        )
        (ok true)
    )
)

;; List sensor data for sale
(define-public (list-sensor-data
    (machine-type (string-utf8 50))
    (sensor-type (string-utf8 50))
    (data-hash (string-ascii 64))
    (description (string-utf8 500))
    (price uint)
    (data-format (string-ascii 20))
    (sampling-rate uint)
    (duration uint)
    (expiry-blocks uint)
    (quality-score uint)
    (category (string-utf8 50))
)
    (let (
        (data-id (var-get next-data-id))
        (provider-data (unwrap! (get-data-provider tx-sender) err-not-found))
    )
        (asserts! (get active provider-data) err-unauthorized)
        (asserts! (>= price (var-get min-data-price)) err-invalid-input)
        (asserts! (<= quality-score u100) err-invalid-quality-score)
        
        (map-set sensor-data-listings
            { data-id: data-id }
            {
                provider: tx-sender,
                machine-type: machine-type,
                sensor-type: sensor-type,
                data-hash: data-hash,
                description: description,
                price: price,
                data-format: data-format,
                sampling-rate: sampling-rate,
                duration: duration,
                timestamp: stacks-block-height,
                expiry: (+ stacks-block-height expiry-blocks),
                quality-score: quality-score,
                total-purchases: u0,
                active: true,
                category: category
            }
        )
        
        ;; Update provider stats
        (map-set data-providers
            { provider: tx-sender }
            (merge provider-data { 
                total-datasets: (+ (get total-datasets provider-data) u1)
            })
        )
        
        (var-set next-data-id (+ data-id u1))
        (ok data-id)
    )
)

;; Purchase sensor data
(define-public (buy-sensor-data (data-id uint))
    (let (
        (listing (unwrap! (get-sensor-data-listing data-id) err-not-found))
        (provider (get provider listing))
        (price (get price listing))
        (platform-fee (/ (* price (var-get platform-fee-percentage)) u100))
        (provider-amount (- price platform-fee))
        (existing-purchase (map-get? data-purchases { data-id: data-id, buyer: tx-sender }))
        (provider-data (unwrap! (get-data-provider provider) err-not-found))
    )
        (asserts! (is-none existing-purchase) err-already-purchased)
        (asserts! (get active listing) err-data-not-active)
        (asserts! (< stacks-block-height (get expiry listing)) err-data-expired)
        
        ;; Transfer payment
        (try! (stx-transfer? price tx-sender (as-contract tx-sender)))
        (try! (as-contract (stx-transfer? provider-amount tx-sender provider)))
        
        ;; Record purchase
        (map-set data-purchases
            { data-id: data-id, buyer: tx-sender }
            {
                purchase-block: stacks-block-height,
                price-paid: price,
                access-granted: true,
                rating: none,
                review: none
            }
        )
        
        ;; Update listing stats
        (map-set sensor-data-listings
            { data-id: data-id }
            (merge listing { 
                total-purchases: (+ (get total-purchases listing) u1)
            })
        )
        
        ;; Update provider revenue
        (map-set data-providers
            { provider: provider }
            (merge provider-data {
                total-revenue: (+ (get total-revenue provider-data) provider-amount)
            })
        )
        
        (ok true)
    )
)

;; Grant access key after purchase
(define-public (grant-access-key 
    (data-id uint) 
    (buyer principal) 
    (key-hash (string-ascii 64))
    (validity-blocks uint)
)
    (let (
        (listing (unwrap! (get-sensor-data-listing data-id) err-not-found))
        (purchase (unwrap! (get-data-purchase data-id buyer) err-not-found))
    )
        (asserts! (is-eq tx-sender (get provider listing)) err-unauthorized)
        (asserts! (get access-granted purchase) err-unauthorized)
        
        (map-set access-keys
            { data-id: data-id, buyer: buyer }
            {
                key-hash: key-hash,
                granted-block: stacks-block-height,
                expires-block: (+ stacks-block-height validity-blocks)
            }
        )
        (ok true)
    )
)

;; Rate and review purchased data
(define-public (rate-data 
    (data-id uint) 
    (rating uint) 
    (review (string-utf8 200))
)
    (let (
        (purchase (unwrap! (get-data-purchase data-id tx-sender) err-not-found))
        (listing (unwrap! (get-sensor-data-listing data-id) err-not-found))
    )
        (asserts! (<= rating u5) err-invalid-input)
        (asserts! (get access-granted purchase) err-unauthorized)
        
        (map-set data-purchases
            { data-id: data-id, buyer: tx-sender }
            (merge purchase {
                rating: (some rating),
                review: (some review)
            })
        )
        (ok true)
    )
)

;; Create a data subscription
(define-public (create-subscription
    (subscriber principal)
    (data-category (string-utf8 50))
    (price-per-period uint)
    (period-blocks uint)
    (duration-periods uint)
)
    (let (
        (subscription-id (var-get next-subscription-id))
        (provider-data (unwrap! (get-data-provider tx-sender) err-not-found))
        (total-blocks (* period-blocks duration-periods))
    )
        (asserts! (get active provider-data) err-unauthorized)
        (asserts! (>= price-per-period (var-get min-data-price)) err-invalid-input)
        
        (map-set subscriptions
            { subscription-id: subscription-id }
            {
                provider: tx-sender,
                subscriber: subscriber,
                data-category: data-category,
                price-per-period: price-per-period,
                period-blocks: period-blocks,
                start-block: stacks-block-height,
                end-block: (+ stacks-block-height total-blocks),
                auto-renew: false,
                active: true
            }
        )
        
        (var-set next-subscription-id (+ subscription-id u1))
        (ok subscription-id)
    )
)

;; Pay for subscription period
(define-public (pay-subscription (subscription-id uint))
    (let (
        (subscription (unwrap! (get-subscription subscription-id) err-not-found))
        (provider (get provider subscription))
        (price (get price-per-period subscription))
        (platform-fee (/ (* price (var-get platform-fee-percentage)) u100))
        (provider-amount (- price platform-fee))
    )
        (asserts! (is-eq tx-sender (get subscriber subscription)) err-unauthorized)
        (asserts! (get active subscription) err-data-not-active)
        
        ;; Transfer payment
        (try! (stx-transfer? price tx-sender (as-contract tx-sender)))
        (try! (as-contract (stx-transfer? provider-amount tx-sender provider)))
        
        ;; Extend subscription
        (map-set subscriptions
            { subscription-id: subscription-id }
            (merge subscription {
                end-block: (+ (get end-block subscription) (get period-blocks subscription))
            })
        )
        
        (ok true)
    )
)

;; Toggle data listing status
(define-public (toggle-data-status (data-id uint))
    (let (
        (listing (unwrap! (get-sensor-data-listing data-id) err-not-found))
    )
        (asserts! (is-eq tx-sender (get provider listing)) err-unauthorized)
        
        (map-set sensor-data-listings
            { data-id: data-id }
            (merge listing { active: (not (get active listing)) })
        )
        (ok true)
    )
)

;; Update data listing price
(define-public (update-data-price (data-id uint) (new-price uint))
    (let (
        (listing (unwrap! (get-sensor-data-listing data-id) err-not-found))
    )
        (asserts! (is-eq tx-sender (get provider listing)) err-unauthorized)
        (asserts! (>= new-price (var-get min-data-price)) err-invalid-input)
        
        (map-set sensor-data-listings
            { data-id: data-id }
            (merge listing { price: new-price })
        )
        (ok true)
    )
)

;; Verify data provider (contract owner only)
(define-public (verify-provider (provider principal))
    (let (
        (provider-data (unwrap! (get-data-provider provider) err-not-found))
    )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        
        (map-set data-providers
            { provider: provider }
            (merge provider-data { verified: true })
        )
        (ok true)
    )
)

;; Update provider reputation score (contract owner only)
(define-public (update-reputation (provider principal) (new-score uint))
    (let (
        (provider-data (unwrap! (get-data-provider provider) err-not-found))
    )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (<= new-score u100) err-invalid-input)
        
        (map-set data-providers
            { provider: provider }
            (merge provider-data { reputation-score: new-score })
        )
        (ok true)
    )
)

;; Update platform fee (contract owner only)
(define-public (update-platform-fee (new-fee uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (<= new-fee u15) err-invalid-input) ;; Max 15% fee
        (var-set platform-fee-percentage new-fee)
        (ok true)
    )
)

;; Update minimum data price (contract owner only)
(define-public (update-min-price (new-min-price uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set min-data-price new-min-price)
        (ok true)
    )
)

;; Toggle provider status
(define-public (toggle-provider-status)
    (let (
        (provider-data (unwrap! (get-data-provider tx-sender) err-not-found))
    )
        (map-set data-providers
            { provider: tx-sender }
            (merge provider-data { active: (not (get active provider-data)) })
        )
        (ok true)
    )
)

;; Cancel subscription
(define-public (cancel-subscription (subscription-id uint))
    (let (
        (subscription (unwrap! (get-subscription subscription-id) err-not-found))
    )
        (asserts! 
            (or 
                (is-eq tx-sender (get subscriber subscription))
                (is-eq tx-sender (get provider subscription))
            ) 
            err-unauthorized
        )
        
        (map-set subscriptions
            { subscription-id: subscription-id }
            (merge subscription { active: false })
        )
        (ok true)
    )
)

;; Helper function for bulk purchase
(define-private (purchase-single-item (data-id uint))
    (match (buy-sensor-data data-id)
        success true
        error false
    )
)

;; Bulk purchase multiple datasets
(define-public (bulk-purchase-data (data-ids (list 10 uint)))
    (ok (map purchase-single-item data-ids))
)