"use strict";(self.webpackChunkowlprotocol_contracts_docs=self.webpackChunkowlprotocol_contracts_docs||[]).push([[968],{7522:(e,t,a)=>{a.d(t,{Zo:()=>c,kt:()=>u});var n=a(9901);function r(e,t,a){return t in e?Object.defineProperty(e,t,{value:a,enumerable:!0,configurable:!0,writable:!0}):e[t]=a,e}function l(e,t){var a=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),a.push.apply(a,n)}return a}function i(e){for(var t=1;t<arguments.length;t++){var a=null!=arguments[t]?arguments[t]:{};t%2?l(Object(a),!0).forEach((function(t){r(e,t,a[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(a)):l(Object(a)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(a,t))}))}return e}function d(e,t){if(null==e)return{};var a,n,r=function(e,t){if(null==e)return{};var a,n,r={},l=Object.keys(e);for(n=0;n<l.length;n++)a=l[n],t.indexOf(a)>=0||(r[a]=e[a]);return r}(e,t);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(e);for(n=0;n<l.length;n++)a=l[n],t.indexOf(a)>=0||Object.prototype.propertyIsEnumerable.call(e,a)&&(r[a]=e[a])}return r}var s=n.createContext({}),p=function(e){var t=n.useContext(s),a=t;return e&&(a="function"==typeof e?e(t):i(i({},t),e)),a},c=function(e){var t=p(e.components);return n.createElement(s.Provider,{value:t},e.children)},m={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},o=n.forwardRef((function(e,t){var a=e.components,r=e.mdxType,l=e.originalType,s=e.parentName,c=d(e,["components","mdxType","originalType","parentName"]),o=p(a),u=r,k=o["".concat(s,".").concat(u)]||o[u]||m[u]||l;return a?n.createElement(k,i(i({ref:t},c),{},{components:a})):n.createElement(k,i({ref:t},c))}));function u(e,t){var a=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var l=a.length,i=new Array(l);i[0]=o;var d={};for(var s in t)hasOwnProperty.call(t,s)&&(d[s]=t[s]);d.originalType=e,d.mdxType="string"==typeof e?e:r,i[1]=d;for(var p=2;p<l;p++)i[p]=a[p];return n.createElement.apply(null,i)}return n.createElement.apply(null,a)}o.displayName="MDXCreateElement"},7572:(e,t,a)=>{a.r(t),a.d(t,{assets:()=>c,contentTitle:()=>s,default:()=>u,frontMatter:()=>d,metadata:()=>p,toc:()=>m});var n=a(4514),r=a(9994),l=(a(9901),a(7522)),i=["components"],d={},s=void 0,p={unversionedId:"contract-docs/ERC1820Registry",id:"contract-docs/ERC1820Registry",title:"ERC1820Registry",description:"ERC1820Registry",source:"@site/docs/contract-docs/ERC1820Registry.md",sourceDirName:"contract-docs",slug:"/contract-docs/ERC1820Registry",permalink:"/contracts/docs/contract-docs/ERC1820Registry",editUrl:"https://github.com/owlprotocol/contracts/docs/contract-docs/ERC1820Registry.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"ERC1820ImplementerInterface",permalink:"/contracts/docs/contract-docs/ERC1820ImplementerInterface"},next:{title:"ERC1967Upgrade",permalink:"/contracts/docs/contract-docs/ERC1967Upgrade"}},c={},m=[{value:"ERC1820Registry",id:"erc1820registry",level:2},{value:"INVALID_ID",id:"invalid_id",level:3},{value:"ERC165ID",id:"erc165id",level:3},{value:"ERC1820_ACCEPT_MAGIC",id:"erc1820_accept_magic",level:3},{value:"interfaces",id:"interfaces",level:3},{value:"managers",id:"managers",level:3},{value:"erc165Cached",id:"erc165cached",level:3},{value:"InterfaceImplementerSet",id:"interfaceimplementerset",level:3},{value:"ManagerChanged",id:"managerchanged",level:3},{value:"getInterfaceImplementer",id:"getinterfaceimplementer",level:3},{value:"setInterfaceImplementer",id:"setinterfaceimplementer",level:3},{value:"setManager",id:"setmanager",level:3},{value:"getManager",id:"getmanager",level:3},{value:"interfaceHash",id:"interfacehash",level:3},{value:"updateERC165Cache",id:"updateerc165cache",level:3},{value:"implementsERC165Interface",id:"implementserc165interface",level:3},{value:"implementsERC165InterfaceNoCache",id:"implementserc165interfacenocache",level:3},{value:"isERC165Interface",id:"iserc165interface",level:3},{value:"noThrowCall",id:"nothrowcall",level:3}],o={toc:m};function u(e){var t=e.components,a=(0,r.Z)(e,i);return(0,l.kt)("wrapper",(0,n.Z)({},o,a,{components:t,mdxType:"MDXLayout"}),(0,l.kt)("h2",{id:"erc1820registry"},"ERC1820Registry"),(0,l.kt)("p",null,"This contract is the official implementation of the ERC1820 Registry.\nFor more details, see ",(0,l.kt)("a",{parentName:"p",href:"https://eips.ethereum.org/EIPS/eip-1820"},"https://eips.ethereum.org/EIPS/eip-1820")),(0,l.kt)("h3",{id:"invalid_id"},"INVALID_ID"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"bytes4 INVALID_ID\n")),(0,l.kt)("p",null,"ERC165 Invalid ID."),(0,l.kt)("h3",{id:"erc165id"},"ERC165ID"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"bytes4 ERC165ID\n")),(0,l.kt)("p",null,"Method ID for the ERC165 supportsInterface method (","="," ","`","bytes4(keccak256(","'","supportsInterface(bytes4)","'","))","`",")."),(0,l.kt)("h3",{id:"erc1820_accept_magic"},"ERC1820_ACCEPT_MAGIC"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"bytes32 ERC1820_ACCEPT_MAGIC\n")),(0,l.kt)("p",null,"Magic value which is returned if a contract implements an interface on behalf of some other address."),(0,l.kt)("h3",{id:"interfaces"},"interfaces"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"mapping(address &#x3D;&gt; mapping(bytes32 &#x3D;&gt; address)) interfaces\n")),(0,l.kt)("p",null,"mapping from addresses and interface hashes to their implementers."),(0,l.kt)("h3",{id:"managers"},"managers"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"mapping(address &#x3D;&gt; address) managers\n")),(0,l.kt)("p",null,"mapping from addresses to their manager."),(0,l.kt)("h3",{id:"erc165cached"},"erc165Cached"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"mapping(address &#x3D;&gt; mapping(bytes4 &#x3D;&gt; bool)) erc165Cached\n")),(0,l.kt)("p",null,"flag for each address and erc165 interface to indicate if it is cached."),(0,l.kt)("h3",{id:"interfaceimplementerset"},"InterfaceImplementerSet"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"event InterfaceImplementerSet(address addr, bytes32 interfaceHash, address implementer)\n")),(0,l.kt)("p",null,"Indicates a contract is the ","'","implementer","'"," of ","'","interfaceHash","'"," for ","'","addr","'","."),(0,l.kt)("h3",{id:"managerchanged"},"ManagerChanged"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"event ManagerChanged(address addr, address newManager)\n")),(0,l.kt)("p",null,"Indicates ","'","newManager","'"," is the address of the new manager for ","'","addr","'","."),(0,l.kt)("h3",{id:"getinterfaceimplementer"},"getInterfaceImplementer"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function getInterfaceImplementer(address _addr, bytes32 _interfaceHash) external view returns (address)\n")),(0,l.kt)("p",null,"Query if an address implements an interface and through which contract."),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Name"),(0,l.kt)("th",{parentName:"tr",align:null},"Type"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"_addr"),(0,l.kt)("td",{parentName:"tr",align:null},"address"),(0,l.kt)("td",{parentName:"tr",align:null},"Address being queried for the implementer of an interface. (If ","'","_addr","'"," is the zero address then ","'","msg.sender","'"," is assumed.)")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"_interfaceHash"),(0,l.kt)("td",{parentName:"tr",align:null},"bytes32"),(0,l.kt)("td",{parentName:"tr",align:null},"Keccak256 hash of the name of the interface as a string. E.g., ","'","web3.utils.keccak256(",'"',"ERC777TokensRecipient",'"',")","'"," for the ","'","ERC777TokensRecipient","'"," interface.")))),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Name"),(0,l.kt)("th",{parentName:"tr",align:null},"Type"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"[0]"),(0,l.kt)("td",{parentName:"tr",align:null},"address"),(0,l.kt)("td",{parentName:"tr",align:null},"The address of the contract which implements the interface ","'","_interfaceHash","'"," for ","'","_addr","'"," or ","'","0","'"," if ","'","_addr","'"," did not register an implementer for this interface.")))),(0,l.kt)("h3",{id:"setinterfaceimplementer"},"setInterfaceImplementer"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function setInterfaceImplementer(address _addr, bytes32 _interfaceHash, address _implementer) external\n")),(0,l.kt)("p",null,"Sets the contract which implements a specific interface for an address.\nOnly the manager defined for that address can set it.\n(Each address is the manager for itself until it sets a new manager.)"),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Name"),(0,l.kt)("th",{parentName:"tr",align:null},"Type"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"_addr"),(0,l.kt)("td",{parentName:"tr",align:null},"address"),(0,l.kt)("td",{parentName:"tr",align:null},"Address for which to set the interface. (If ","'","_addr","'"," is the zero address then ","'","msg.sender","'"," is assumed.)")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"_interfaceHash"),(0,l.kt)("td",{parentName:"tr",align:null},"bytes32"),(0,l.kt)("td",{parentName:"tr",align:null},"Keccak256 hash of the name of the interface as a string. E.g., ","'","web3.utils.keccak256(",'"',"ERC777TokensRecipient",'"',")","'"," for the ","'","ERC777TokensRecipient","'"," interface.")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"_implementer"),(0,l.kt)("td",{parentName:"tr",align:null},"address"),(0,l.kt)("td",{parentName:"tr",align:null},"Contract address implementing ","'","_interfaceHash","'"," for ","'","_addr","'",".")))),(0,l.kt)("h3",{id:"setmanager"},"setManager"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function setManager(address _addr, address _newManager) external\n")),(0,l.kt)("p",null,"Sets ","'","_newManager","'"," as manager for ","'","_addr","'",".\nThe new manager will be able to call ","'","setInterfaceImplementer","'"," for ","'","_addr","'","."),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Name"),(0,l.kt)("th",{parentName:"tr",align:null},"Type"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"_addr"),(0,l.kt)("td",{parentName:"tr",align:null},"address"),(0,l.kt)("td",{parentName:"tr",align:null},"Address for which to set the new manager.")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"_newManager"),(0,l.kt)("td",{parentName:"tr",align:null},"address"),(0,l.kt)("td",{parentName:"tr",align:null},"Address of the new manager for ","'","addr","'",". (Pass ","'","0x0","'"," to reset the manager to ","'","_addr","'",".)")))),(0,l.kt)("h3",{id:"getmanager"},"getManager"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function getManager(address _addr) public view returns (address)\n")),(0,l.kt)("p",null,"Get the manager of an address."),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Name"),(0,l.kt)("th",{parentName:"tr",align:null},"Type"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"_addr"),(0,l.kt)("td",{parentName:"tr",align:null},"address"),(0,l.kt)("td",{parentName:"tr",align:null},"Address for which to return the manager.")))),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Name"),(0,l.kt)("th",{parentName:"tr",align:null},"Type"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"[0]"),(0,l.kt)("td",{parentName:"tr",align:null},"address"),(0,l.kt)("td",{parentName:"tr",align:null},"Address of the manager for a given address.")))),(0,l.kt)("h3",{id:"interfacehash"},"interfaceHash"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function interfaceHash(string _interfaceName) external pure returns (bytes32)\n")),(0,l.kt)("p",null,"Compute the keccak256 hash of an interface given its name."),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Name"),(0,l.kt)("th",{parentName:"tr",align:null},"Type"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"_interfaceName"),(0,l.kt)("td",{parentName:"tr",align:null},"string"),(0,l.kt)("td",{parentName:"tr",align:null},"Name of the interface.")))),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Name"),(0,l.kt)("th",{parentName:"tr",align:null},"Type"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"[0]"),(0,l.kt)("td",{parentName:"tr",align:null},"bytes32"),(0,l.kt)("td",{parentName:"tr",align:null},"The keccak256 hash of an interface name.")))),(0,l.kt)("h3",{id:"updateerc165cache"},"updateERC165Cache"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function updateERC165Cache(address _contract, bytes4 _interfaceId) external\n")),(0,l.kt)("p",null,"Updates the cache with whether the contract implements an ERC165 interface or not."),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Name"),(0,l.kt)("th",{parentName:"tr",align:null},"Type"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"_contract"),(0,l.kt)("td",{parentName:"tr",align:null},"address"),(0,l.kt)("td",{parentName:"tr",align:null},"Address of the contract for which to update the cache.")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"_interfaceId"),(0,l.kt)("td",{parentName:"tr",align:null},"bytes4"),(0,l.kt)("td",{parentName:"tr",align:null},"ERC165 interface for which to update the cache.")))),(0,l.kt)("h3",{id:"implementserc165interface"},"implementsERC165Interface"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function implementsERC165Interface(address _contract, bytes4 _interfaceId) public view returns (bool)\n")),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Name"),(0,l.kt)("th",{parentName:"tr",align:null},"Type"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"_contract"),(0,l.kt)("td",{parentName:"tr",align:null},"address"),(0,l.kt)("td",{parentName:"tr",align:null},"Address of the contract to check.")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"_interfaceId"),(0,l.kt)("td",{parentName:"tr",align:null},"bytes4"),(0,l.kt)("td",{parentName:"tr",align:null},"ERC165 interface to check.")))),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Name"),(0,l.kt)("th",{parentName:"tr",align:null},"Type"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"[0]"),(0,l.kt)("td",{parentName:"tr",align:null},"bool"),(0,l.kt)("td",{parentName:"tr",align:null},"True if ","'","_contract","'"," implements ","'","_interfaceId","'",", false otherwise.")))),(0,l.kt)("h3",{id:"implementserc165interfacenocache"},"implementsERC165InterfaceNoCache"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function implementsERC165InterfaceNoCache(address _contract, bytes4 _interfaceId) public view returns (bool)\n")),(0,l.kt)("p",null,"Checks whether a contract implements an ERC165 interface or not without using nor updating the cache."),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Name"),(0,l.kt)("th",{parentName:"tr",align:null},"Type"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"_contract"),(0,l.kt)("td",{parentName:"tr",align:null},"address"),(0,l.kt)("td",{parentName:"tr",align:null},"Address of the contract to check.")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"_interfaceId"),(0,l.kt)("td",{parentName:"tr",align:null},"bytes4"),(0,l.kt)("td",{parentName:"tr",align:null},"ERC165 interface to check.")))),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Name"),(0,l.kt)("th",{parentName:"tr",align:null},"Type"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"[0]"),(0,l.kt)("td",{parentName:"tr",align:null},"bool"),(0,l.kt)("td",{parentName:"tr",align:null},"True if ","'","_contract","'"," implements ","'","_interfaceId","'",", false otherwise.")))),(0,l.kt)("h3",{id:"iserc165interface"},"isERC165Interface"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function isERC165Interface(bytes32 _interfaceHash) internal pure returns (bool)\n")),(0,l.kt)("p",null,"Checks whether the hash is a ERC165 interface (ending with 28 zeroes) or not."),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Name"),(0,l.kt)("th",{parentName:"tr",align:null},"Type"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"_interfaceHash"),(0,l.kt)("td",{parentName:"tr",align:null},"bytes32"),(0,l.kt)("td",{parentName:"tr",align:null},"The hash to check.")))),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Name"),(0,l.kt)("th",{parentName:"tr",align:null},"Type"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"[0]"),(0,l.kt)("td",{parentName:"tr",align:null},"bool"),(0,l.kt)("td",{parentName:"tr",align:null},"True if ","'","_interfaceHash","'"," is an ERC165 interface (ending with 28 zeroes), false otherwise.")))),(0,l.kt)("h3",{id:"nothrowcall"},"noThrowCall"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function noThrowCall(address _contract, bytes4 _interfaceId) internal view returns (uint256 success, uint256 result)\n")),(0,l.kt)("p",null,(0,l.kt)("em",{parentName:"p"},"Make a call on a contract without throwing if the function does not exist.")))}u.isMDXComponent=!0}}]);