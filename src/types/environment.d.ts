declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV: 'development' | 'production' | 'test';
            RPC_URL: string;
            ACCOUNT_ADDRESS: string;
            HD_WALLET_MNEMONIC: string | undefined;
            PRIVATE_KEYS: string | undefined;
        }
    }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};
