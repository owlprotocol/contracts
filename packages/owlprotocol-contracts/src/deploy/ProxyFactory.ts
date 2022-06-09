import { ethers } from 'hardhat';

(async () => {
    const [admin] = await ethers.getSigners();

    console.log(admin.address);

    const ERC1167FactoryFactory = await ethers.getContractFactory('ERC1167Factory');
    const ERC1167Factory = await ERC1167FactoryFactory.deploy();

    console.log(`Deployed to: ${ERC1167Factory.address}`);
})();
