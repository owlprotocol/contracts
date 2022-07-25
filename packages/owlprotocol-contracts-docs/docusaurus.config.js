// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");

/** @type {import('@docusaurus/types').Config} */
const config = {
    title: "Owl Protocol Contracts Documentation",
    tagline: "WEB3.0 Made Easy",
    url: "https://owlprotocol.github.io",
    baseUrl: "/contracts/",
    deploymentBranch: "gh-pages",
    onBrokenLinks: "warn",
    onBrokenMarkdownLinks: "warn",
    favicon: "img/solidity.svg",
    organizationName: "owlprotocol", // Usually your GitHub org/user name.
    plugins: [
        // //https://github.com/tgreyuk/typedoc-plugin-markdown/tree/master/packages/docusaurus-plugin-typedoc
        /*
        [
            'docusaurus-plugin-typedoc',
            {
                entryPoints: ["../web3-redux-components/src"],
                out: "web3-redux-components-reference",
                tsconfig: '../web3-redux-components/tsconfig.json',
                watch: process.env.TYPEDOC_WATCH,
                readme: 'none',
                sidebar: {
                    categoryLabel: 'Reference',
                }
            }
        ],
        */
    ],
    projectName: "contracts", // Usually your repo name.

    presets: [
        [
            "classic",
            /** @type {import('@docusaurus/preset-classic').Options} */
            ({
                docs: {
                    sidebarPath: require.resolve("./sidebars.js"),
                    // Please change this to your repo.
                    editUrl: "https://github.com/owlprotocol/contracts/",
                },
                theme: {
                    customCss: require.resolve("./src/css/custom.css"),
                },
            }),
        ],
    ],
    themeConfig:
        /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
        ({
            navbar: {
                title: "Owl Protocol Contracts",
                logo: {
                    alt: "Web3 Redux Logo 2",
                    src: "img/solidity.svg",
                },
                items: [
                    {
                        type: "doc",
                        docId: "index",
                        position: "left",
                        label: "Welcome",
                    },
                    {
                        type: "doc",
                        docId: "contracts",
                        position: "left",
                        label: "Contracts",
                    },
                    {
                        type: "doc",
                        docId: "contract-docs/index",
                        position: "left",
                        label: "Reference",
                    },
                    /*
                    {
                        type: 'docsVersionDropdown',
                    },
                    */
                    {
                        href: "https://github.com/owlprotocol/contracts/tree/develop/packages/owlprotocol-contracts",
                        label: "GitHub",
                        position: "right",
                    },
                ],
            },
            footer: {
                style: "dark",
                links: [
                    // {
                    //     title: 'Quickstart',
                    //     items: [
                    //         {
                    //             label: 'Quickstart',
                    //             to: '/docs/web3-redux-quickstart',
                    //         },
                    //     ],
                    // },
                    // {
                    //     title: 'Reference',
                    //     items: [
                    //         {
                    //             label: 'Reference',
                    //             to: '/docs/web3-redux-reference',
                    //         },
                    //     ],
                    // },
                    {
                        title: "Community",
                        items: [
                            /*
                            {
                                label: 'Discord',
                                href: 'https://discordapp.com/invite/owlprotocol',
                            },
                            */
                            {
                                label: "Twitter",
                                href: "https://twitter.com/owlprotocol",
                            },
                        ],
                    },
                    {
                        title: "More",
                        items: [
                            {
                                label: "GitHub",
                                href: "https://github.com/owlprotocol/contracts/tree/develop/packages/owlprotocol-contracts",
                            },
                        ],
                    },
                ],
                copyright: `Copyright © ${new Date().getFullYear()} Owl Labs. Built with Docusaurus.`,
            },
            prism: {
                theme: lightCodeTheme,
                darkTheme: darkCodeTheme,
            },
        }),
};

module.exports = config;
