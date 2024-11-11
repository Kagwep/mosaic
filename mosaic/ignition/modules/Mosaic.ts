// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition
// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const Mosaic = "0x5c770AB50F2A83a5703e574Ef3a5437542092986";


const MosaicModule = buildModule("DancerModule", (m) => {
  const mosaic= m.getParameter("initialOwner", Mosaic);


  const mosaic_contract = m.contract("Mosaic", [mosaic]);

  return { mosaic_contract };
});

export default MosaicModule;
