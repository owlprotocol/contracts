export default function setProvider(contracts: any[], provider: any, defaultAccount?: string) {
    contracts.forEach((c) => {
        c.setProvider(provider);
        if (defaultAccount) {
            c.web3.eth.defaultAccount = defaultAccount;
        }
    });
}
