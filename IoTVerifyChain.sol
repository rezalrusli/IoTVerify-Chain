// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract IoTVerifyChain {

    address public sysAdmin;

    struct Device {
        string deviceId;
        string deviceName;
        string deviceType;
        string vendor;
        address deviceAddress;
        uint256 registeredAt;
        bool exists;
    }

    mapping(string => Device) private devices;
    string[] private deviceIds;

    event DeviceRegistered(
        string deviceId,
        string deviceName,
        string deviceType,
        string vendor,
        address deviceAddress,
        uint256 registeredAt
    );

    modifier onlySysAdmin() {
        require(msg.sender == sysAdmin, "Only SysAdmin");
        _;
    }

    constructor() {
        sysAdmin = msg.sender;
    }

    function registerDevice(
        string memory _deviceId,
        string memory _deviceName,
        string memory _deviceType,
        string memory _vendor,
        address _deviceAddress
    ) external onlySysAdmin {

        require(!devices[_deviceId].exists, "Device already exists");

        devices[_deviceId] = Device({
            deviceId: _deviceId,
            deviceName: _deviceName,
            deviceType: _deviceType,
            vendor: _vendor,
            deviceAddress: _deviceAddress,
            registeredAt: block.timestamp,
            exists: true
        });

        deviceIds.push(_deviceId);

        emit DeviceRegistered(
            _deviceId,
            _deviceName,
            _deviceType,
            _vendor,
            _deviceAddress,
            block.timestamp
        );
    }

    function getDevice(
        string memory _deviceId
    )
        external
        view
        returns (
            string memory,
            string memory,
            string memory,
            string memory,
            address,
            uint256,
            bool
        )
    {
        Device memory d = devices[_deviceId];

        return (
            d.deviceId,
            d.deviceName,
            d.deviceType,
            d.vendor,
            d.deviceAddress,
            d.registeredAt,
            d.exists
        );
    }

    function getTotalDevices() external view returns(uint256) {
        return deviceIds.length;
    }

    function isDeviceRegistered(
        string memory _deviceId
    ) external view returns(bool) {

        return devices[_deviceId].exists;
    }

    function getDeviceAddress(
        string memory _deviceId
    ) external view returns(address) {

        require(devices[_deviceId].exists, "Device not found");

        return devices[_deviceId].deviceAddress;
    }
    function getDeviceIdByIndex(
        uint256 index
    )
        external
        view
        returns (string memory)
    {
        require(index < deviceIds.length, "Index out of range");

        return deviceIds[index];
    }
}