import { Network } from 'hardhat/types/runtime';
import { mainnet } from "./configs";

export default function getGSNConfig(network: Network) {

    // TODO - configure to return for different networks, according to
    // OpenGSN configruation - https://docs.opengsn.org/networks/ethereum/mainnet.html
    return mainnet;

}
