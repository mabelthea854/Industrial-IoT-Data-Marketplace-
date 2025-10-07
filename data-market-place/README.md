# Industrial IoT Data Marketplace

A decentralized marketplace built on the Stacks blockchain for buying and selling industrial IoT sensor data. This smart contract enables data providers to monetize their machine sensor data while allowing buyers to access high-quality industrial data for analytics, machine learning, and research purposes.

## 🌟 Features

### For Data Providers
- **Provider Registration**: Register as a verified data provider with company information
- **Data Listing**: List sensor data with detailed metadata (machine type, sensor type, quality score, etc.)
- **Flexible Pricing**: Set custom prices for each dataset above the minimum threshold
- **Revenue Tracking**: Automatic tracking of total revenue and dataset statistics
- **Subscription Services**: Create recurring subscription plans for data categories
- **Reputation System**: Build reputation through quality scores and buyer reviews
- **Access Control**: Grant encrypted access keys to buyers after purchase

### For Data Buyers
- **Browse Listings**: Search and filter available sensor data by category, type, and quality
- **Secure Purchases**: Buy individual datasets or subscribe to data categories
- **Bulk Purchasing**: Purchase multiple datasets in a single transaction
- **Quality Assurance**: Rate and review purchased data
- **Access Verification**: Check purchase history and data access rights
- **Transparent Pricing**: View fee breakdown before purchase

### Platform Features
- **Decentralized**: Fully on-chain marketplace with no intermediaries
- **Automated Payments**: Smart contract handles payment distribution automatically
- **Platform Fee**: Configurable platform fee (default 3%)
- **Data Expiry**: Time-limited data listings with automatic expiry
- **Verification System**: Admin verification for trusted providers
- **Quality Scores**: 0-100 quality rating system for datasets

## 📋 Prerequisites

- Stacks blockchain wallet (Hiro Wallet, Xverse, etc.)
- STX tokens for transactions
- Clarity development environment (for deployment and testing)

## 🚀 Getting Started

### For Data Providers

1. **Register as a Provider**
```clarity
(contract-call? .iot-marketplace register-provider u"Your Company Name")
```

2. **List Your Sensor Data**
```clarity
(contract-call? .iot-marketplace list-sensor-data
    u"CNC Machine"              ;; machine-type
    u"Temperature Sensor"       ;; sensor-type
    "QmX7Y8Z9...hash"          ;; data-hash (IPFS/storage)
    u"Temperature readings..."  ;; description
    u50000                      ;; price in microSTX
    "JSON"                      ;; data-format
    u10                         ;; sampling-rate (Hz)
    u86400                      ;; duration (seconds)
    u144                        ;; expiry-blocks
    u95                         ;; quality-score (0-100)
    u"Manufacturing"            ;; category
)
```

3. **Grant Access After Purchase**
```clarity
(contract-call? .iot-marketplace grant-access-key
    u1                          ;; data-id
    'ST2CY5V39...               ;; buyer principal
    "encrypted-key-hash"        ;; key-hash
    u500                        ;; validity-blocks
)
```

### For Data Buyers

1. **Browse Available Data**
```clarity
(contract-call? .iot-marketplace get-sensor-data-listing u1)
```

2. **Purchase Data**
```clarity
(contract-call? .iot-marketplace buy-sensor-data u1)
```

3. **Rate Purchased Data**
```clarity
(contract-call? .iot-marketplace rate-data
    u1                          ;; data-id
    u5                          ;; rating (0-5 stars)
    u"Excellent data quality!"  ;; review
)
```

4. **Check Data Access**
```clarity
(contract-call? .iot-marketplace check-data-access u1 tx-sender)
```

## 📊 Contract Structure

### Data Maps

- **data-providers**: Stores provider information (company name, verification status, revenue, reputation)
- **sensor-data-listings**: Contains all dataset listings with metadata
- **data-purchases**: Records all purchase transactions
- **access-keys**: Manages encrypted access keys for buyers
- **subscriptions**: Handles recurring subscription data

### Key Constants

```clarity
platform-fee-percentage: 3%      ;; Platform fee on each sale
min-data-price: 10,000 microSTX  ;; Minimum listing price
```

### Error Codes

| Code | Constant | Description |
|------|----------|-------------|
| u200 | err-owner-only | Action restricted to contract owner |
| u201 | err-not-found | Resource not found |
| u202 | err-already-exists | Resource already exists |
| u203 | err-unauthorized | Unauthorized action |
| u204 | err-insufficient-payment | Payment amount insufficient |
| u205 | err-data-expired | Data listing has expired |
| u206 | err-invalid-input | Invalid input parameters |
| u207 | err-data-not-active | Data listing is not active |
| u208 | err-already-purchased | Data already purchased by buyer |
| u209 | err-invalid-quality-score | Quality score must be 0-100 |

## 🔐 Security Features

### Payment Security
- Atomic transactions ensure payments are only processed if all conditions are met
- Platform fee automatically deducted and distributed
- Provider receives payment directly to their wallet

### Access Control
- Only providers can list data and grant access keys
- Only buyers who purchased data can access it
- Provider verification system for trusted sources
- Time-limited access keys with configurable expiry

### Data Integrity
- Immutable purchase records on-chain
- IPFS/distributed storage hash references
- Quality scores and reviews for transparency
- Expiry mechanisms prevent stale data sales

## 💰 Fee Structure

### Platform Fee
- Default: **3%** of sale price
- Configurable by contract owner (max 15%)
- Automatically deducted from each transaction

### Example Transaction (100,000 microSTX listing):
```
Total Price:      100,000 microSTX
Platform Fee:       3,000 microSTX (3%)
Provider Receives: 97,000 microSTX
```

### Minimum Pricing
- Minimum data price: **10,000 microSTX** (0.00001 STX)
- Adjustable by contract owner

## 📈 Use Cases

### Industrial Applications
- **Predictive Maintenance**: Access vibration and temperature data for ML models
- **Quality Control**: Historical sensor data for manufacturing optimization
- **Energy Management**: Power consumption patterns for efficiency analysis
- **Supply Chain**: Environmental sensor data for logistics optimization

### Research & Development
- **Academic Research**: Real-world industrial data for studies
- **Algorithm Development**: Training data for AI/ML models
- **Benchmarking**: Industry standard datasets for comparison
- **Simulation**: Historical data for digital twin development

### Data Monetization
- **IoT Device Manufacturers**: Monetize device data streams
- **Industrial Facilities**: Generate revenue from existing sensor infrastructure
- **Research Institutions**: Share and monetize collected data
- **Service Providers**: Offer data-as-a-service subscriptions

## 🔧 Admin Functions

Contract owners can perform administrative tasks:

### Verify Provider
```clarity
(contract-call? .iot-marketplace verify-provider 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
```

### Update Reputation Score
```clarity
(contract-call? .iot-marketplace update-reputation
    'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
    u85  ;; new score (0-100)
)
```

### Update Platform Fee
```clarity
(contract-call? .iot-marketplace update-platform-fee u5)  ;; 5%
```

### Update Minimum Price
```clarity
(contract-call? .iot-marketplace update-min-price u20000)
```

## 🧪 Testing

The contract includes a comprehensive test suite covering:
- Provider registration and management
- Data listing and validation
- Purchase transactions and payment distribution
- Access key management
- Rating and review system
- Subscription management
- Admin functions
- Edge cases and error handling

Run tests with:
```bash
npm test
# or
vitest
```

## 📝 Data Format Guidelines

### Supported Formats
- JSON (recommended for structured sensor data)
- CSV (for time-series data)
- XML (for complex hierarchical data)
- Binary formats (with proper documentation)

### Metadata Best Practices
- **Machine Type**: Be specific (e.g., "CNC Mill Model X2000")
- **Sensor Type**: Include manufacturer/model (e.g., "Bosch BMP280 Temperature Sensor")
- **Description**: Include data collection context, sampling methodology, and use cases
- **Quality Score**: Rate based on accuracy, completeness, and noise levels
- **Duration**: Specify exact time span of data collection
- **Sampling Rate**: Critical for time-series analysis

### Storage Recommendations
- Use IPFS for decentralized storage
- Include content hash in listing
- Consider data compression for large datasets
- Implement encryption for sensitive data
- Provide data schema/documentation

## 🤝 Contributing

We welcome contributions! Areas for improvement:
- Enhanced search and filtering capabilities
- Data preview functionality
- Automated quality verification
- Multi-token payment support
- Advanced subscription models
- Data bundling features

## 📄 License

This smart contract is provided as-is for educational and commercial use. Please review the code thoroughly before deployment in production environments.

## 🔗 Resources

- [Stacks Documentation](https://docs.stacks.co/)
- [Clarity Language Reference](https://docs.stacks.co/clarity/)
- [IPFS Documentation](https://docs.ipfs.io/)
- [Hiro Wallet](https://wallet.hiro.so/)

## 📞 Support

For questions, issues, or feature requests:
- Open an issue on GitHub
- Join the Stacks Discord community
- Review the contract documentation

## ⚠️ Disclaimer

This smart contract handles financial transactions. Users should:
- Review the contract code thoroughly
- Test on testnet before mainnet deployment
- Understand the fee structure
- Secure their private keys
- Consider data privacy regulations
- Verify provider reputation before purchases

---

**Built with ❤️ on Stacks blockchain**