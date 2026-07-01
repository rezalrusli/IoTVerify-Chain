# IoTVerify-Chain

> Blockchain-Based IoT Device Identity Management for Smart City

IoTVerify-Chain is a blockchain-based decentralized application (dApp) that provides secure IoT device registration and verification for smart city environments. Instead of storing operational IoT data on-chain, the platform maintains a trusted and immutable registry of IoT device identities using Ethereum smart contracts.

---

## 🌆 Web3 dApp Architecture

<p align="center">
  <img src="screenshots/architecture.png" width="900">
</p>

---

## 📖 Table of Contents

- Project Overview
- Technology Stack
- Project Folder Structure
- Prerequisites
- Installation
- Environment Configuration
- Compile Smart Contract
- Deploy Smart Contract
- Configure MetaMask
- Run the Frontend dApp
- Testing
- System Workflow
- Real-World Implementation
- Troubleshooting

---

# 🚀 Project Overview

IoTVerify-Chain addresses IoT device spoofing and impersonation in smart city environments.

Unlike conventional IoT systems where attackers may clone Device IDs, MAC addresses, or vendor information, every registered device in IoTVerify-Chain possesses a cryptographic blockchain identity.

Each registered device consists of:

- Device ID
- Device Name
- Device Type
- Vendor
- Ethereum Public Address
- Registration Timestamp
- Registration Status

The blockchain stores only the public identity, while the device owner securely keeps the private key for future verification.

---

# 🛠 Technology Stack

| Component | Technology |
|-----------|------------|
| Smart Contract | Solidity |
| Development Framework | Hardhat |
| Blockchain | Ethereum Sepolia Testnet |
| Frontend | React + Vite |
| Blockchain Library | Ethers.js |
| Wallet | MetaMask |
| RPC Provider | Alchemy |

---

# 📁 Project Folder Structure

```text
IoTVerify-Chain/
│
├── blockchain/
│   ├── contracts/
│   ├── scripts/
│   ├── artifacts/
│   ├── hardhat.config.ts
│   └── package.json
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── screenshots/
│
├── report/
│
├── presentation/
│
└── README.md
```

---

# 📋 Prerequisites

Install the following software before running the project.

- Node.js
- npm
- Visual Studio Code
- MetaMask Extension
- Alchemy Account
- Sepolia ETH

Check installation:

```bash
node -v
npm -v
```

---

# 📦 Install Dependencies

### Blockchain

```bash
cd blockchain
npm install
```

### Frontend

```bash
cd frontend
npm install
```

---

# ⚙ Configure Environment Files

## Blockchain

Create

```text
blockchain/.env
```

```env
SEPOLIA_RPC_URL=
PRIVATE_KEY=
```

---

## Frontend

Create

```text
frontend/.env
```

```env
VITE_CONTRACT_ADDRESS=
```

---

# ⚡ Compile Smart Contract

```bash
cd blockchain

npx hardhat compile
```

Expected output

```
Compiled successfully
```

Copy ABI

```text
blockchain/artifacts/contracts/IoTVerifyChain.sol/IoTVerifyChain.json
```

to

```text
frontend/src/IoTVerifyChain.json
```

---

# 🚀 Deploy Smart Contract

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

Expected output

```
====================================
IoTVerify-Chain deployed to:
0x.....
====================================
```

---

# 🦊 Configure MetaMask

Use

| Item | Value |
|------|-------|
| Network | Ethereum Sepolia |
| RPC | Alchemy |
| Chain ID | 11155111 |
| Currency | ETH |
| Explorer | https://sepolia.etherscan.io |

---

# 💻 Run Frontend

```bash
cd frontend

npm run dev
```

Open

```
http://localhost:5173
```

---

# 🧪 Testing

## Register Device

1. Enter Device Information
2. Generate Device Key Pair
3. Register Device
4. Confirm MetaMask Transaction

Expected Result

✅ Device Registered

---

## Verify Device

1. Select Device
2. Enter Device Private Key
3. Click Verify

Expected Result

✅ Verified Device

---

## Failed Verification

Enter an incorrect private key.

Expected Result

❌ Failed Verification

---

# 🔄 System Workflow

```text
Generate Device Wallet
        │
        ▼
Store Public Address On Blockchain
        │
        ▼
Private Key Stored By Device Owner
        │
        ▼
Verification
        │
        ▼
Recover Ethereum Address
        │
        ▼
Compare With Registered Address
        │
        ▼
Verified / Failed
```

---

# 🌍 Real-World Deployment

For demonstration purposes, the device private key is stored in a downloadable credential file.

In production, the private key should be securely embedded within the IoT device using hardware such as:

- Secure Element
- TPM
- HSM
- Trusted Execution Environment

---

# 📷 Application Screenshots

## Dashboard

![Dashboard](screenshots/dashboard.png)

---

## Device Registration

![Registration](screenshots/register.png)

---

## Device Verification

![Verification](screenshots/verify.png)

---

# ⚠ Troubleshooting

## "could not coalesce error"

- Use Alchemy RPC
- Disconnect localhost
- Refresh MetaMask

---

## "Only SysAdmin"

Use the wallet that deployed the smart contract.

---

## Contract Address Changed

Update

```text
frontend/.env
```

Restart

```bash
npm run dev
```

---

# 📄 License

Developed for

**CCS5537 Blockchain Technology**

Universiti Putra Malaysia

---

⭐ If you find this project useful, please consider giving it a star.
