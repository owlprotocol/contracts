"use strict";(self.webpackChunkowlprotocol_contracts_docs=self.webpackChunkowlprotocol_contracts_docs||[]).push([[29],{7522:(t,e,n)=>{n.d(e,{Zo:()=>u,kt:()=>k});var a=n(9901);function r(t,e,n){return e in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function l(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(t);e&&(a=a.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),n.push.apply(n,a)}return n}function i(t){for(var e=1;e<arguments.length;e++){var n=null!=arguments[e]?arguments[e]:{};e%2?l(Object(n),!0).forEach((function(e){r(t,e,n[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):l(Object(n)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(n,e))}))}return t}function o(t,e){if(null==t)return{};var n,a,r=function(t,e){if(null==t)return{};var n,a,r={},l=Object.keys(t);for(a=0;a<l.length;a++)n=l[a],e.indexOf(n)>=0||(r[n]=t[n]);return r}(t,e);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(t);for(a=0;a<l.length;a++)n=l[a],e.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(t,n)&&(r[n]=t[n])}return r}var p=a.createContext({}),d=function(t){var e=a.useContext(p),n=e;return t&&(n="function"==typeof t?t(e):i(i({},e),t)),n},u=function(t){var e=d(t.components);return a.createElement(p.Provider,{value:e},t.children)},s={inlineCode:"code",wrapper:function(t){var e=t.children;return a.createElement(a.Fragment,{},e)}},m=a.forwardRef((function(t,e){var n=t.components,r=t.mdxType,l=t.originalType,p=t.parentName,u=o(t,["components","mdxType","originalType","parentName"]),m=d(n),k=r,c=m["".concat(p,".").concat(k)]||m[k]||s[k]||l;return n?a.createElement(c,i(i({ref:e},u),{},{components:n})):a.createElement(c,i({ref:e},u))}));function k(t,e){var n=arguments,r=e&&e.mdxType;if("string"==typeof t||r){var l=n.length,i=new Array(l);i[0]=m;var o={};for(var p in e)hasOwnProperty.call(e,p)&&(o[p]=e[p]);o.originalType=t,o.mdxType="string"==typeof t?t:r,i[1]=o;for(var d=2;d<l;d++)i[d]=n[d];return a.createElement.apply(null,i)}return a.createElement.apply(null,n)}m.displayName="MDXCreateElement"},1030:(t,e,n)=>{n.r(e),n.d(e,{assets:()=>u,contentTitle:()=>p,default:()=>k,frontMatter:()=>o,metadata:()=>d,toc:()=>s});var a=n(2875),r=n(358),l=(n(9901),n(7522)),i=["components"],o={},p=void 0,d={unversionedId:"contract-docs/ERC721OwlAttributes",id:"contract-docs/ERC721OwlAttributes",title:"ERC721OwlAttributes",description:"ERC721OwlAttributes",source:"@site/docs/contract-docs/ERC721OwlAttributes.md",sourceDirName:"contract-docs",slug:"/contract-docs/ERC721OwlAttributes",permalink:"/contracts/docs/contract-docs/ERC721OwlAttributes",draft:!1,editUrl:"https://github.com/owlprotocol/contracts/docs/contract-docs/ERC721OwlAttributes.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"ERC721Owl",permalink:"/contracts/docs/contract-docs/ERC721Owl"},next:{title:"ERC721OwlExpiring",permalink:"/contracts/docs/contract-docs/ERC721OwlExpiring"}},u={},s=[{value:"ERC721OwlAttributes",id:"erc721owlattributes",level:2},{value:"DNA_ROLE",id:"dna_role",level:3},{value:"ERC165TAG",id:"erc165tag",level:3},{value:"dnas",id:"dnas",level:3},{value:"nextId",id:"nextid",level:3},{value:"initialize",id:"initialize",level:3},{value:"proxyInitialize",id:"proxyinitialize",level:3},{value:"__ERC721OwlAttributes_init",id:"__erc721owlattributes_init",level:3},{value:"__ERC721OwlAttributes_init_unchained",id:"__erc721owlattributes_init_unchained",level:3},{value:"grantDna",id:"grantdna",level:3},{value:"tokenURI",id:"tokenuri",level:3},{value:"mint",id:"mint",level:3},{value:"safeMint",id:"safemint",level:3},{value:"updateDna",id:"updatedna",level:3},{value:"getDna",id:"getdna",level:3},{value:"supportsInterface",id:"supportsinterface",level:3}],m={toc:s};function k(t){var e=t.components,n=(0,r.Z)(t,i);return(0,l.kt)("wrapper",(0,a.Z)({},m,n,{components:e,mdxType:"MDXLayout"}),(0,l.kt)("h2",{id:"erc721owlattributes"},"ERC721OwlAttributes"),(0,l.kt)("p",null,"This implementation is an extension of OwlProtocol's base {ERC721Owl}\nthat enables on-chain encoding. In most uses of ",(0,l.kt)("inlineCode",{parentName:"p"},"ERC721"),", contract deployers\nhave chosen to keep all metadata off-chain. While this is\neconomical in terms of gas costs it also disallows on-chain actors\n(first-party or third-party) to deploy contracts that depend on the metadata.\nThis contract solves the latter without sacrificing on the former."),(0,l.kt)("p",null,"In this contract, each ",(0,l.kt)("inlineCode",{parentName:"p"},"tokenId")," is auto-incremented, solely determined by\nthe order of the mint. Each ",(0,l.kt)("inlineCode",{parentName:"p"},"tokenId")," is also paired with a ",(0,l.kt)("inlineCode",{parentName:"p"},"dna")," at the time\nof mint. The ",(0,l.kt)("inlineCode",{parentName:"p"},"dna")," will hold an encoding of all attributes for that\nspecific ",(0,l.kt)("inlineCode",{parentName:"p"},"tokenId"),", stored in the ",(0,l.kt)("inlineCode",{parentName:"p"},"dnas")," mapping."),(0,l.kt)("p",null,'A "dna" will be stored in its decimal form, however all the metadata can\nbe decoded from its binary form, given the configuration of its "genes". A\n"gene" represents a potential attribute that a ',(0,l.kt)("inlineCode",{parentName:"p"},"tokenId"),' can posses. The\nsize of the "gene" (how many bits it will be allocated in the binary form)\nwill be determined by the amount of possible options the attribute (that the\n"gene" represents) can have.'),(0,l.kt)("p",null,'A quick exemplification of the concept of "genes": Suppose an\n{ERC721OwlAttributes} instance with 3 attributes and 4 options for each\nattribute: 4 options can be encoded into two bits (log(4) = 2). Since there\nare three total attributes, the ',(0,l.kt)("inlineCode",{parentName:"p"},"tokenId"),"s in this {ERC721OwlAttributes}\ninstance will require 6 bits for encoding. Suppose the attributes options are\nin arrays:"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre"},"attributes1 = [option1, ..., option4]\nattributes2 = [option1, ..., option4]\nattributes3 = [option1, ..., option4]\n")),(0,l.kt)("p",null,"So if a ",(0,l.kt)("inlineCode",{parentName:"p"},"tokenId"),' was minted with a "dna" that had a binary format of\n',(0,l.kt)("inlineCode",{parentName:"p"},"01 10 11"),", that ",(0,l.kt)("inlineCode",{parentName:"p"},"tokenId"),"'s metadata would be:"),(0,l.kt)("ul",null,(0,l.kt)("li",{parentName:"ul"},(0,l.kt)("inlineCode",{parentName:"li"},"option2")," for ",(0,l.kt)("inlineCode",{parentName:"li"},"attributes1")),(0,l.kt)("li",{parentName:"ul"},(0,l.kt)("inlineCode",{parentName:"li"},"option3")," for ",(0,l.kt)("inlineCode",{parentName:"li"},"attributes2")),(0,l.kt)("li",{parentName:"ul"},(0,l.kt)("inlineCode",{parentName:"li"},"option4")," for ",(0,l.kt)("inlineCode",{parentName:"li"},"attributes3"))),(0,l.kt)("p",null,(0,l.kt)("inlineCode",{parentName:"p"},"01 10 11")," in its decimal form is 27 which is what would be mapped to the\n",(0,l.kt)("inlineCode",{parentName:"p"},"tokenId")," it was assigned during minting."),(0,l.kt)("p",null,"If it were ever required, the genes array for this {ERC721OwlAttribtues}\ninstance would be ",(0,l.kt)("inlineCode",{parentName:"p"},"[0, 2, 4, 6]"),'. They are, in order, the index ranges of\neach "gene" in the binary format of the "dna". The genes array must begin at\n0 and be strictly increasing. The max size of a "dna" is 256 bits so no\nelement in the genes should be above 255 (it is a uint8[] array).'),(0,l.kt)("p",null,"The ",(0,l.kt)("inlineCode",{parentName:"p"},"dnas")," mapping can be dynamically updated by ",(0,l.kt)("inlineCode",{parentName:"p"},"DNA_ROLE")," through the\n",(0,l.kt)("inlineCode",{parentName:"p"},"updateDna()")," function."),(0,l.kt)("h3",{id:"dna_role"},"DNA_ROLE"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"bytes32 DNA_ROLE\n")),(0,l.kt)("h3",{id:"erc165tag"},"ERC165TAG"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"bytes4 ERC165TAG\n")),(0,l.kt)("h3",{id:"dnas"},"dnas"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"mapping(uint256 => uint256) dnas\n")),(0,l.kt)("h3",{id:"nextid"},"nextId"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"struct CountersUpgradeable.Counter nextId\n")),(0,l.kt)("h3",{id:"initialize"},"initialize"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function initialize(address _admin, string _name, string _symbol, string baseURI_, address _forwarder, address _receiver, uint96 _feeNumerator) external virtual\n")),(0,l.kt)("p",null,"Initializes contract (replaces constructor in proxy pattern)"),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Name"),(0,l.kt)("th",{parentName:"tr",align:null},"Type"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"_admin"),(0,l.kt)("td",{parentName:"tr",align:null},"address"),(0,l.kt)("td",{parentName:"tr",align:null},"owner")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"_name"),(0,l.kt)("td",{parentName:"tr",align:null},"string"),(0,l.kt)("td",{parentName:"tr",align:null},"name")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"_symbol"),(0,l.kt)("td",{parentName:"tr",align:null},"string"),(0,l.kt)("td",{parentName:"tr",align:null},"symbol")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"baseURI_"),(0,l.kt)("td",{parentName:"tr",align:null},"string"),(0,l.kt)("td",{parentName:"tr",align:null},"uri")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"_forwarder"),(0,l.kt)("td",{parentName:"tr",align:null},"address"),(0,l.kt)("td",{parentName:"tr",align:null},"trusted forwarder address for openGSN")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"_receiver"),(0,l.kt)("td",{parentName:"tr",align:null},"address"),(0,l.kt)("td",{parentName:"tr",align:null},"address of receiver of royalty fees")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"_feeNumerator"),(0,l.kt)("td",{parentName:"tr",align:null},"uint96"),(0,l.kt)("td",{parentName:"tr",align:null},"numerator of fee proportion (numerator / 10000)")))),(0,l.kt)("h3",{id:"proxyinitialize"},"proxyInitialize"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function proxyInitialize(address _admin, string _name, string _symbol, string baseURI_, address _forwarder, address _receiver, uint96 _feeNumerator) external virtual\n")),(0,l.kt)("p",null,"Initializes contract through beacon proxy (replaces constructor in\nproxy pattern)"),(0,l.kt)("h3",{id:"__erc721owlattributes_init"},"__ERC721OwlAttributes_init"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function __ERC721OwlAttributes_init(address _admin, string _name, string _symbol, string baseURI_, address _forwarder, address _receiver, uint96 _feeNumerator) internal\n")),(0,l.kt)("h3",{id:"__erc721owlattributes_init_unchained"},"__ERC721OwlAttributes_init_unchained"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function __ERC721OwlAttributes_init_unchained() internal\n")),(0,l.kt)("h3",{id:"grantdna"},"grantDna"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function grantDna(address to) public\n")),(0,l.kt)("p",null,"Must have DEFAULT_ADMIN_ROLE"),(0,l.kt)("p",null,"Grants DNA_ROLE to ",(0,l.kt)("inlineCode",{parentName:"p"},"to")),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Name"),(0,l.kt)("th",{parentName:"tr",align:null},"Type"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"to"),(0,l.kt)("td",{parentName:"tr",align:null},"address"),(0,l.kt)("td",{parentName:"tr",align:null},"address to")))),(0,l.kt)("h3",{id:"tokenuri"},"tokenURI"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function tokenURI(uint256 tokenId) public view virtual returns (string uri)\n")),(0,l.kt)("p",null,"returns uri for token metadata."),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Name"),(0,l.kt)("th",{parentName:"tr",align:null},"Type"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"tokenId"),(0,l.kt)("td",{parentName:"tr",align:null},"uint256"),(0,l.kt)("td",{parentName:"tr",align:null},"tokenId metadata to fetch")))),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Name"),(0,l.kt)("th",{parentName:"tr",align:null},"Type"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"uri"),(0,l.kt)("td",{parentName:"tr",align:null},"string"),(0,l.kt)("td",{parentName:"tr",align:null},"at which metadata is housed")))),(0,l.kt)("h3",{id:"mint"},"mint"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function mint(address to, uint256 dna) public virtual\n")),(0,l.kt)("p",null,"Must have MINTER_ROLE"),(0,l.kt)("p",null,"Allows MINTER_ROLE to mint NFTs"),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Name"),(0,l.kt)("th",{parentName:"tr",align:null},"Type"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"to"),(0,l.kt)("td",{parentName:"tr",align:null},"address"),(0,l.kt)("td",{parentName:"tr",align:null},"address to")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"dna"),(0,l.kt)("td",{parentName:"tr",align:null},"uint256"),(0,l.kt)("td",{parentName:"tr",align:null},"of next tokenId")))),(0,l.kt)("h3",{id:"safemint"},"safeMint"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function safeMint(address to, uint256 dna) public virtual\n")),(0,l.kt)("p",null,"Must have MINTER_ROLE"),(0,l.kt)("p",null,"Allows caller to mint NFTs (safeMint)"),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Name"),(0,l.kt)("th",{parentName:"tr",align:null},"Type"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"to"),(0,l.kt)("td",{parentName:"tr",align:null},"address"),(0,l.kt)("td",{parentName:"tr",align:null},"address to")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"dna"),(0,l.kt)("td",{parentName:"tr",align:null},"uint256"),(0,l.kt)("td",{parentName:"tr",align:null},"of next tokenId")))),(0,l.kt)("h3",{id:"updatedna"},"updateDna"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function updateDna(uint256 tokenId, uint256 dna) external\n")),(0,l.kt)("p",null,"Must have DNA_ROLE"),(0,l.kt)("p",null,"Allows changing the dna of a tokenId"),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Name"),(0,l.kt)("th",{parentName:"tr",align:null},"Type"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"tokenId"),(0,l.kt)("td",{parentName:"tr",align:null},"uint256"),(0,l.kt)("td",{parentName:"tr",align:null},"whose dna to change")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"dna"),(0,l.kt)("td",{parentName:"tr",align:null},"uint256"),(0,l.kt)("td",{parentName:"tr",align:null},"new dna for the provided tokenId")))),(0,l.kt)("h3",{id:"getdna"},"getDna"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function getDna(uint256 tokenId) external view returns (uint256)\n")),(0,l.kt)("p",null,"Getter for dna of tokenId"),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Name"),(0,l.kt)("th",{parentName:"tr",align:null},"Type"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"tokenId"),(0,l.kt)("td",{parentName:"tr",align:null},"uint256"),(0,l.kt)("td",{parentName:"tr",align:null},"whose dna to change")))),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Name"),(0,l.kt)("th",{parentName:"tr",align:null},"Type"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"[0]"),(0,l.kt)("td",{parentName:"tr",align:null},"uint256"),(0,l.kt)("td",{parentName:"tr",align:null},"dna of tokenId")))),(0,l.kt)("h3",{id:"supportsinterface"},"supportsInterface"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)\n")),(0,l.kt)("p",null,"ERC165 Support"),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Name"),(0,l.kt)("th",{parentName:"tr",align:null},"Type"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"interfaceId"),(0,l.kt)("td",{parentName:"tr",align:null},"bytes4"),(0,l.kt)("td",{parentName:"tr",align:null},"hash of the interface testing for")))),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Name"),(0,l.kt)("th",{parentName:"tr",align:null},"Type"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"[0]"),(0,l.kt)("td",{parentName:"tr",align:null},"bool"),(0,l.kt)("td",{parentName:"tr",align:null},"bool whether interface is supported")))))}k.isMDXComponent=!0}}]);