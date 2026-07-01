import { useMemo, useState } from "react";
import { ethers } from "ethers";
import IoTVerifyChain from "./IoTVerifyChain.json";
import "./App.css";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const PAGE_SIZE = 5;

function App() {
  const [activeTab, setActiveTab] = useState("register");
  const [adminAccount, setAdminAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [message, setMessage] = useState("");

  const [deviceId, setDeviceId] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [deviceType, setDeviceType] = useState("CCTV");
  const [vendor, setVendor] = useState("Hikvision");
  const [deviceWallet, setDeviceWallet] = useState(null);
  const [lastCredential, setLastCredential] = useState(null);

  const [devices, setDevices] = useState([]);
  const [totalDevices, setTotalDevices] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const [verifyDeviceId, setVerifyDeviceId] = useState("");
  const [verifyPrivateKey, setVerifyPrivateKey] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);
  const [verificationHistory, setVerificationHistory] = useState([]);
  const [successfulVerifications, setSuccessfulVerifications] = useState(0);
  const [failedVerifications, setFailedVerifications] = useState(0);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setMessage("MetaMask not found.");
        return;
      }

      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contractInstance = new ethers.Contract(
        CONTRACT_ADDRESS,
        IoTVerifyChain.abi,
        signer
      );

      setAdminAccount(accounts[0]);
      setContract(contractInstance);
      setMessage("SysAdmin wallet connected.");
      await loadDevices(contractInstance);
    } catch (err) {
      console.error(err);
      setMessage(err.reason || err.shortMessage || err.message || "Connection failed.");
    }
  };

  const copyToClipboard = async (value, label = "Value") => {
    try {
      await navigator.clipboard.writeText(value);
      setMessage(`${label} copied to clipboard.`);
    } catch (err) {
      console.error(err);
      setMessage(`Failed to copy ${label}.`);
    }
  };

  const generateDeviceWallet = () => {
    const wallet = ethers.Wallet.createRandom();
    setDeviceWallet({ address: wallet.address, privateKey: wallet.privateKey });
    setLastCredential(null);
    setMessage("Device key pair generated. Store the private key securely.");
  };

  const downloadJson = (filename, data) => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCredential = () => {
    if (!lastCredential) {
      setMessage("No credential available to download.");
      return;
    }
    downloadJson(`${lastCredential.deviceId}-credential.json`, lastCredential);
    setMessage("Device credential downloaded.");
  };

  const registerDevice = async (e) => {
    e.preventDefault();

    if (!contract) {
      setMessage("Please connect SysAdmin wallet first.");
      return;
    }

    if (!deviceWallet) {
      setMessage("Please generate device key pair first.");
      return;
    }

    const credential = {
      deviceId,
      deviceName,
      deviceType,
      vendor,
      publicAddress: deviceWallet.address,
      privateKey: deviceWallet.privateKey,
      issuedAt: new Date().toISOString(),
      note: "Private key is a device secret for proof-of-concept verification. Do not expose it in production.",
    };

    try {
      setMessage("Registering device to blockchain...");
      const tx = await contract.registerDevice(
        deviceId,
        deviceName,
        deviceType,
        vendor,
        deviceWallet.address
      );

      await tx.wait();

      setLastCredential(credential);
      setMessage("Device registered successfully. Credential is ready to download.");
      setDeviceId("");
      setDeviceName("");
      setDeviceWallet(null);
      await loadDevices(contract);
    } catch (err) {
      console.error(err);
      setMessage(err.reason || err.shortMessage || err.message || "Device registration failed.");
    }
  };

  const loadDevices = async (contractInstance = contract) => {
    if (!contractInstance) return;

    try {
      const total = await contractInstance.getTotalDevices();
      const count = Number(total);
      setTotalDevices(count);

      const loadedDevices = [];

      for (let i = 0; i < count; i++) {
        const id = await contractInstance.getDeviceIdByIndex(i);
        const d = await contractInstance.getDevice(id);

        loadedDevices.push({
          deviceId: d[0],
          deviceName: d[1],
          deviceType: d[2],
          vendor: d[3],
          deviceAddress: d[4],
          registeredAt: Number(d[5]),
          exists: d[6],
        });
      }

      setDevices(loadedDevices);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      setMessage(err.reason || err.shortMessage || err.message || "Failed to load devices.");
    }
  };

  const selectedDevice = useMemo(() => {
    return devices.find((d) => d.deviceId === verifyDeviceId);
  }, [devices, verifyDeviceId]);

  const filteredDevices = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return devices.filter((d) => {
      const matchesSearch =
        !search ||
        d.deviceId.toLowerCase().includes(search) ||
        d.deviceName.toLowerCase().includes(search) ||
        d.vendor.toLowerCase().includes(search) ||
        d.deviceAddress.toLowerCase().includes(search);

      const matchesType = typeFilter === "All" || d.deviceType === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [devices, searchTerm, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredDevices.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const paginatedDevices = filteredDevices.slice(startIndex, startIndex + PAGE_SIZE);

  const verifyDevice = async () => {
    try {
      if (!contract) {
        setMessage("Please connect SysAdmin wallet first.");
        return;
      }

      if (!verifyDeviceId) {
        setMessage("Please select a device to verify.");
        return;
      }

      if (!verifyPrivateKey) {
        setMessage("Please paste the device credential private key.");
        return;
      }

      const challenge = `IoTVerify-Chain verification request for ${verifyDeviceId}: ${crypto.randomUUID()}`;
      const wallet = new ethers.Wallet(verifyPrivateKey);
      const signature = await wallet.signMessage(challenge);
      const registeredAddress = await contract.getDeviceAddress(verifyDeviceId);
      const recoveredAddress = ethers.verifyMessage(challenge, signature);
      const isValid = registeredAddress.toLowerCase() === recoveredAddress.toLowerCase();

      if (isValid) {
        setSuccessfulVerifications((prev) => prev + 1);
      } else {
        setFailedVerifications((prev) => prev + 1);
      }

      const result = {
        isValid,
        deviceId: verifyDeviceId,
        deviceName: selectedDevice?.deviceName || "-",
        deviceType: selectedDevice?.deviceType || "-",
        vendor: selectedDevice?.vendor || "-",
        registeredAddress,
        recoveredAddress,
        verifiedAt: new Date().toLocaleString(),
      };

      setVerifyResult(result);
      setVerificationHistory((prev) => [
        { id: crypto.randomUUID(), ...result, status: isValid ? "SUCCESS" : "FAILED" },
        ...prev,
      ]);

      setMessage(
        isValid
          ? "Device verified successfully."
          : "Verification failed. The private key does not match the registered device identity."
      );
    } catch (err) {
      console.error(err);
      setMessage("Invalid private key format or verification failed.");
    }
  };

  const resetVerification = () => {
    setVerifyDeviceId("");
    setVerifyPrivateKey("");
    setVerifyResult(null);
    setMessage("Verification form reset.");
  };

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-content">
          <div className="hero-kicker">🛡 Trusted Smart City Device Identity Platform</div>

          <h1>
            IoT<span>Verify</span>-Chain
          </h1>

          <p className="subtitle">
            Blockchain-based device registration and cryptographic verification for
            trusted multi-vendor IoT infrastructure.
          </p>
        </div>

        <div className="hero-network">
          <div className="cube cube-1"></div>
          <div className="cube cube-2"></div>
          <div className="cube cube-3"></div>
          <div className="shield-visual">✓</div>
        </div>

        <div className="hero-action">
          <div className="wallet-icon">🛡</div>
          <h3>SysAdmin Access</h3>

          <button className="primary-btn" onClick={connectWallet}>
            💳 Connect SysAdmin Wallet
          </button>

          <p>
            {adminAccount
              ? "Wallet connected and ready to manage registry."
              : "Connect wallet to manage device registry."}
          </p>
        </div>
      </header>

      <section className="wallet-card">
        <div>
          <span>SysAdmin Wallet</span>
          <strong>{adminAccount || "Not connected"}</strong>
        </div>

        <div>
          <span>Contract Address</span>
          <strong>{CONTRACT_ADDRESS}</strong>
        </div>
      </section>

      <section className="stats-grid">
        <div className="stat-card stat-blue">
          <span>Total Devices</span>
          <h2>{totalDevices}</h2>
          <p>Registered on-chain</p>
        </div>

        <div className="stat-card stat-green">
          <span>Successful Verifications</span>
          <h2>{successfulVerifications}</h2>
          <p>Authenticated devices</p>
        </div>

        <div className="stat-card stat-red">
          <span>Failed Verifications</span>
          <h2>{failedVerifications}</h2>
          <p>Mismatch or possible spoofing</p>
        </div>
      </section>

      <section className="tabs">
        <button
          className={activeTab === "register" ? "tab active" : "tab"}
          onClick={() => setActiveTab("register")}
        >
          📝 Device Registration
        </button>

        <button
          className={activeTab === "verify" ? "tab active" : "tab"}
          onClick={() => setActiveTab("verify")}
        >
          🔐 Device Verification
        </button>
      </section>

      {activeTab === "register" && (
        <main className="main-grid">
          <section className="panel">
            <h2>Register IoT Device</h2>

            <p className="panel-desc">
              Generate a device wallet. The public address is stored on-chain,
              while the private key represents the device credential.
            </p>

            <form onSubmit={registerDevice}>
              <label>Device ID</label>
              <input
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                placeholder="CCTV-001"
                required
              />

              <label>Device Name</label>
              <input
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="Main Road CCTV"
                required
              />

              <label>Device Type</label>
              <select value={deviceType} onChange={(e) => setDeviceType(e.target.value)}>
                <option>CCTV</option>
                <option>Water Sensor</option>
                <option>Traffic Light Controller</option>
                <option>Air Quality Sensor</option>
                <option>Parking Sensor</option>
              </select>

              <label>Vendor</label>
              <select value={vendor} onChange={(e) => setVendor(e.target.value)}>
                <option>Hikvision</option>
                <option>Bosch</option>
                <option>Siemens</option>
                <option>Honeywell</option>
                <option>Libelium</option>
                <option>Other</option>
              </select>

              <button type="button" className="secondary-btn" onClick={generateDeviceWallet}>
                Generate Device Key Pair
              </button>

              {deviceWallet && (
                <div className="key-box">
                  <div className="field-row">
                    <p><b>Device Public Address</b></p>
                    <button
                      type="button"
                      className="mini-btn"
                      onClick={() => copyToClipboard(deviceWallet.address, "Device public address")}
                    >
                      Copy
                    </button>
                  </div>

                  <code>{deviceWallet.address}</code>

                  <div className="field-row">
                    <p><b>Device Private Key</b></p>
                    <button
                      type="button"
                      className="mini-btn danger-btn"
                      onClick={() => copyToClipboard(deviceWallet.privateKey, "Device private key")}
                    >
                      Copy
                    </button>
                  </div>

                  <code className="danger">{deviceWallet.privateKey}</code>

                  <p className="warning">
                    Store this private key securely. It is required to verify the device identity.
                  </p>
                </div>
              )}

              <button type="submit" className="primary-btn full">
                Register Device on Blockchain
              </button>
            </form>

            {lastCredential && (
              <div className="credential-card">
                <h3>Device Credential Issued</h3>
                <p>
                  The device has been registered on-chain. Download the credential
                  file for verification testing.
                </p>

                <button type="button" className="secondary-btn full" onClick={downloadCredential}>
                  Download Device Credential JSON
                </button>
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Device Registry</h2>
                <p className="panel-desc">
                  Registered device public identities are stored as immutable blockchain records.
                </p>
              </div>

              <button type="button" className="secondary-btn small" onClick={() => loadDevices(contract)}>
                Refresh
              </button>
            </div>

            <div className="filter-grid">
              <input
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search device, vendor, address..."
              />

              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option>All</option>
                <option>CCTV</option>
                <option>Water Sensor</option>
                <option>Traffic Light Controller</option>
                <option>Air Quality Sensor</option>
                <option>Parking Sensor</option>
              </select>
            </div>

            {paginatedDevices.length === 0 ? (
              <div className="empty-state">No registered devices found.</div>
            ) : (
              <>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Device ID</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Vendor</th>
                        <th>Status</th>
                        <th>Device Address</th>
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedDevices.map((d) => (
                        <tr key={d.deviceId}>
                          <td>{d.deviceId}</td>
                          <td>{d.deviceName}</td>
                          <td>{d.deviceType}</td>
                          <td>{d.vendor}</td>
                          <td><span className="status-badge">Registered</span></td>
                          <td className="address-cell">{d.deviceAddress}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pagination">
                  <span>
                    Showing {startIndex + 1}-{Math.min(startIndex + PAGE_SIZE, filteredDevices.length)} of {filteredDevices.length}
                  </span>

                  <div>
                    <button
                      className="page-btn"
                      disabled={safePage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </button>

                    <span className="page-number">Page {safePage} of {totalPages}</span>

                    <button
                      className="page-btn"
                      disabled={safePage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </main>
      )}

      {activeTab === "verify" && (
        <section className="panel verify-panel">
          <h2>Verify IoT Device</h2>

          <p className="panel-desc center-text">
            Verify device ownership using blockchain identity and cryptographic credentials.
          </p>

          <div className="verify-grid">
            <div>
              <label>Select Device ID</label>

              <select value={verifyDeviceId} onChange={(e) => setVerifyDeviceId(e.target.value)}>
                <option value="">Select registered device</option>

                {devices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.deviceId} - {d.deviceName}
                  </option>
                ))}
              </select>

              <label>Device Credential (Private Key)</label>

              <input
                value={verifyPrivateKey}
                onChange={(e) => setVerifyPrivateKey(e.target.value)}
                placeholder="Paste device private key"
              />

              <div className="button-row">
                <button type="button" className="primary-btn full" onClick={verifyDevice}>
                  Verify Device
                </button>

                <button type="button" className="secondary-btn full" onClick={resetVerification}>
                  Reset
                </button>
              </div>
            </div>

            <div className="result-card">
              <h3>Verification Result</h3>

              {!verifyResult ? (
                <p className="muted">No verification performed yet.</p>
              ) : verifyResult.isValid ? (
                <div className="success-result">
                  <h2>🟢 VERIFIED DEVICE</h2>
                  <p>The credential matches the registered blockchain device identity.</p>
                </div>
              ) : (
                <div className="fail-result">
                  <h2>🔴 FAILED VERIFICATION</h2>
                  <p>The credential does not match the registered blockchain device identity.</p>
                </div>
              )}

              {verifyResult && (
                <>
                  <div className="device-summary">
                    <p><b>Device ID:</b> {verifyResult.deviceId}</p>
                    <p><b>Name:</b> {verifyResult.deviceName}</p>
                    <p><b>Type:</b> {verifyResult.deviceType}</p>
                    <p><b>Vendor:</b> {verifyResult.vendor}</p>
                  </div>

                  <p><b>Registered Address</b></p>
                  <code>{verifyResult.registeredAddress}</code>

                  <p><b>Recovered Signer Address</b></p>
                  <code>{verifyResult.recoveredAddress}</code>
                </>
              )}
            </div>
          </div>

          <section className="history-panel">
            <h3>Verification History</h3>

            {verificationHistory.length === 0 ? (
              <div className="empty-state">No verification history yet.</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Device ID</th>
                      <th>Name</th>
                      <th>Vendor</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {verificationHistory.map((h) => (
                      <tr key={h.id}>
                        <td>{h.verifiedAt}</td>
                        <td>{h.deviceId}</td>
                        <td>{h.deviceName}</td>
                        <td>{h.vendor}</td>
                        <td>
                          <span className={h.status === "SUCCESS" ? "status-success" : "status-failed"}>
                            {h.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </section>
      )}

      <section className="message-box">
        <b>System Message:</b> {message || "Ready."}
      </section>
    </div>
  );
}

export default App;