"use strict";(self.webpackChunkowlprotocol_contracts_docs=self.webpackChunkowlprotocol_contracts_docs||[]).push([[704],{7522:(t,e,a)=>{a.d(e,{Zo:()=>u,kt:()=>m});var n=a(9901);function r(t,e,a){return e in t?Object.defineProperty(t,e,{value:a,enumerable:!0,configurable:!0,writable:!0}):t[e]=a,t}function l(t,e){var a=Object.keys(t);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(t);e&&(n=n.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),a.push.apply(a,n)}return a}function i(t){for(var e=1;e<arguments.length;e++){var a=null!=arguments[e]?arguments[e]:{};e%2?l(Object(a),!0).forEach((function(e){r(t,e,a[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(a)):l(Object(a)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(a,e))}))}return t}function o(t,e){if(null==t)return{};var a,n,r=function(t,e){if(null==t)return{};var a,n,r={},l=Object.keys(t);for(n=0;n<l.length;n++)a=l[n],e.indexOf(a)>=0||(r[a]=t[a]);return r}(t,e);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(t);for(n=0;n<l.length;n++)a=l[n],e.indexOf(a)>=0||Object.prototype.propertyIsEnumerable.call(t,a)&&(r[a]=t[a])}return r}var s=n.createContext({}),p=function(t){var e=n.useContext(s),a=e;return t&&(a="function"==typeof t?t(e):i(i({},e),t)),a},u=function(t){var e=p(t.components);return n.createElement(s.Provider,{value:e},t.children)},d={inlineCode:"code",wrapper:function(t){var e=t.children;return n.createElement(n.Fragment,{},e)}},c=n.forwardRef((function(t,e){var a=t.components,r=t.mdxType,l=t.originalType,s=t.parentName,u=o(t,["components","mdxType","originalType","parentName"]),c=p(a),m=r,k=c["".concat(s,".").concat(m)]||c[m]||d[m]||l;return a?n.createElement(k,i(i({ref:e},u),{},{components:a})):n.createElement(k,i({ref:e},u))}));function m(t,e){var a=arguments,r=e&&e.mdxType;if("string"==typeof t||r){var l=a.length,i=new Array(l);i[0]=c;var o={};for(var s in e)hasOwnProperty.call(e,s)&&(o[s]=e[s]);o.originalType=t,o.mdxType="string"==typeof t?t:r,i[1]=o;for(var p=2;p<l;p++)i[p]=a[p];return n.createElement.apply(null,i)}return n.createElement.apply(null,a)}c.displayName="MDXCreateElement"},9553:(t,e,a)=>{a.r(e),a.d(e,{assets:()=>u,contentTitle:()=>s,default:()=>m,frontMatter:()=>o,metadata:()=>p,toc:()=>d});var n=a(4514),r=a(9994),l=(a(9901),a(7522)),i=["components"],o={},s=void 0,p={unversionedId:"contract-docs/ERC721Owl",id:"contract-docs/ERC721Owl",title:"ERC721Owl",description:"ERC721Owl",source:"@site/docs/contract-docs/ERC721Owl.md",sourceDirName:"contract-docs",slug:"/contract-docs/ERC721Owl",permalink:"/contracts/docs/contract-docs/ERC721Owl",editUrl:"https://github.com/owlprotocol/contracts/docs/contract-docs/ERC721Owl.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"ERC20Owl",permalink:"/contracts/docs/contract-docs/ERC20Owl"},next:{title:"ERC721OwlAttributes",permalink:"/contracts/docs/contract-docs/ERC721OwlAttributes"}},u={},d=[{value:"ERC721Owl",id:"erc721owl",level:2},{value:"MINTER_ROLE",id:"minter_role",level:3},{value:"URI_ROLE",id:"uri_role",level:3},{value:"version",id:"version",level:3},{value:"ERC165TAG",id:"erc165tag",level:3},{value:"baseURI",id:"baseuri",level:3},{value:"constructor",id:"constructor",level:3},{value:"initialize",id:"initialize",level:3},{value:"proxyInitialize",id:"proxyinitialize",level:3},{value:"__ERC721Owl_init",id:"__erc721owl_init",level:3},{value:"__ERC721Owl_init_unchained",id:"__erc721owl_init_unchained",level:3},{value:"grantMinter",id:"grantminter",level:3},{value:"grantUriRole",id:"granturirole",level:3},{value:"mint",id:"mint",level:3},{value:"safeMint",id:"safemint",level:3},{value:"setBaseURI",id:"setbaseuri",level:3},{value:"_baseURI",id:"_baseuri",level:3},{value:"contractURI",id:"contracturi",level:3},{value:"exists",id:"exists",level:3},{value:"supportsInterface",id:"supportsinterface",level:3},{value:"__gap",id:"__gap",level:3}],c={toc:d};function m(t){var e=t.components,a=(0,r.Z)(t,i);return(0,l.kt)("wrapper",(0,n.Z)({},c,a,{components:e,mdxType:"MDXLayout"}),(0,l.kt)("h2",{id:"erc721owl"},"ERC721Owl"),(0,l.kt)("h3",{id:"minter_role"},"MINTER_ROLE"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"bytes32 MINTER_ROLE\n")),(0,l.kt)("h3",{id:"uri_role"},"URI_ROLE"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"bytes32 URI_ROLE\n")),(0,l.kt)("h3",{id:"version"},"version"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"string version\n")),(0,l.kt)("h3",{id:"erc165tag"},"ERC165TAG"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"bytes4 ERC165TAG\n")),(0,l.kt)("h3",{id:"baseuri"},"baseURI"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"string baseURI\n")),(0,l.kt)("h3",{id:"constructor"},"constructor"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"constructor() public\n")),(0,l.kt)("h3",{id:"initialize"},"initialize"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function initialize(address _admin, string _name, string _symbol, string baseURI_) external virtual\n")),(0,l.kt)("h3",{id:"proxyinitialize"},"proxyInitialize"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function proxyInitialize(address _admin, string _name, string _symbol, string baseURI_) external virtual\n")),(0,l.kt)("h3",{id:"__erc721owl_init"},"__ERC721Owl_init"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function __ERC721Owl_init(address _admin, string _name, string _symbol, string baseURI_) internal\n")),(0,l.kt)("h3",{id:"__erc721owl_init_unchained"},"__ERC721Owl_init_unchained"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function __ERC721Owl_init_unchained(address _admin, string baseURI_) internal\n")),(0,l.kt)("h3",{id:"grantminter"},"grantMinter"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function grantMinter(address to) public\n")),(0,l.kt)("p",null,"Must have DEFAULT_ADMIN_ROLE"),(0,l.kt)("p",null,(0,l.kt)("em",{parentName:"p"},"Grants MINTER_ROLE to {a}")),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Name"),(0,l.kt)("th",{parentName:"tr",align:null},"Type"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"to"),(0,l.kt)("td",{parentName:"tr",align:null},"address"),(0,l.kt)("td",{parentName:"tr",align:null},"address to")))),(0,l.kt)("h3",{id:"granturirole"},"grantUriRole"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function grantUriRole(address to) public\n")),(0,l.kt)("p",null,"Must have DEFAULT_ADMIN_ROLE"),(0,l.kt)("p",null,(0,l.kt)("em",{parentName:"p"},"Grants URI_ROLE to {a}")),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Name"),(0,l.kt)("th",{parentName:"tr",align:null},"Type"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"to"),(0,l.kt)("td",{parentName:"tr",align:null},"address"),(0,l.kt)("td",{parentName:"tr",align:null},"address to")))),(0,l.kt)("h3",{id:"mint"},"mint"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function mint(address to, uint256 tokenId) public virtual\n")),(0,l.kt)("p",null,"Must have MINTER_ROLE"),(0,l.kt)("p",null,(0,l.kt)("em",{parentName:"p"},"Allows MINTER_ROLE to mint NFTs")),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Name"),(0,l.kt)("th",{parentName:"tr",align:null},"Type"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"to"),(0,l.kt)("td",{parentName:"tr",align:null},"address"),(0,l.kt)("td",{parentName:"tr",align:null},"address to")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"tokenId"),(0,l.kt)("td",{parentName:"tr",align:null},"uint256"),(0,l.kt)("td",{parentName:"tr",align:null},"tokenId value")))),(0,l.kt)("h3",{id:"safemint"},"safeMint"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function safeMint(address to, uint256 tokenId) public virtual\n")),(0,l.kt)("p",null,"Must have MINTER_ROLE"),(0,l.kt)("p",null,(0,l.kt)("em",{parentName:"p"},"Allows caller to mint NFTs (safeMint)")),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Name"),(0,l.kt)("th",{parentName:"tr",align:null},"Type"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"to"),(0,l.kt)("td",{parentName:"tr",align:null},"address"),(0,l.kt)("td",{parentName:"tr",align:null},"address to")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"tokenId"),(0,l.kt)("td",{parentName:"tr",align:null},"uint256"),(0,l.kt)("td",{parentName:"tr",align:null},"tokenId value")))),(0,l.kt)("h3",{id:"setbaseuri"},"setBaseURI"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function setBaseURI(string baseURI_) public\n")),(0,l.kt)("p",null,"Must have URI_ROLE role!"),(0,l.kt)("p",null,(0,l.kt)("em",{parentName:"p"},"Allows setting the baseURI")),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Name"),(0,l.kt)("th",{parentName:"tr",align:null},"Type"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"baseURI_"),(0,l.kt)("td",{parentName:"tr",align:null},"string"),(0,l.kt)("td",{parentName:"tr",align:null},"set the baseURI value.")))),(0,l.kt)("h3",{id:"_baseuri"},"_baseURI"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function _baseURI() internal view returns (string)\n")),(0,l.kt)("p",null,(0,l.kt)("em",{parentName:"p"},"Overrides OZ internal baseURI getter.")),(0,l.kt)("h3",{id:"contracturi"},"contractURI"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function contractURI() public view returns (string)\n")),(0,l.kt)("p",null,(0,l.kt)("em",{parentName:"p"},"Returns collection-wide URI-accessible metadata")),(0,l.kt)("h3",{id:"exists"},"exists"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function exists(uint256 tokenId) external view returns (bool)\n")),(0,l.kt)("h3",{id:"supportsinterface"},"supportsInterface"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)\n")),(0,l.kt)("p",null,(0,l.kt)("em",{parentName:"p"},"ERC165 Support")),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Name"),(0,l.kt)("th",{parentName:"tr",align:null},"Type"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"interfaceId"),(0,l.kt)("td",{parentName:"tr",align:null},"bytes4"),(0,l.kt)("td",{parentName:"tr",align:null},"hash of the interface testing for")))),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Name"),(0,l.kt)("th",{parentName:"tr",align:null},"Type"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"[0]"),(0,l.kt)("td",{parentName:"tr",align:null},"bool"),(0,l.kt)("td",{parentName:"tr",align:null},"bool whether interface is supported")))),(0,l.kt)("h3",{id:"__gap"},"__gap"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"uint256[49] __gap\n")))}m.isMDXComponent=!0}}]);