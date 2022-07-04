"use strict";(self.webpackChunkowlprotocol_contracts_docs=self.webpackChunkowlprotocol_contracts_docs||[]).push([[61],{7522:(e,t,r)=>{r.d(t,{Zo:()=>m,kt:()=>f});var n=r(9901);function a(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function c(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function o(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?c(Object(r),!0).forEach((function(t){a(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):c(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function l(e,t){if(null==e)return{};var r,n,a=function(e,t){if(null==e)return{};var r,n,a={},c=Object.keys(e);for(n=0;n<c.length;n++)r=c[n],t.indexOf(r)>=0||(a[r]=e[r]);return a}(e,t);if(Object.getOwnPropertySymbols){var c=Object.getOwnPropertySymbols(e);for(n=0;n<c.length;n++)r=c[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(a[r]=e[r])}return a}var i=n.createContext({}),p=function(e){var t=n.useContext(i),r=t;return e&&(r="function"==typeof e?e(t):o(o({},t),e)),r},m=function(e){var t=p(e.components);return n.createElement(i.Provider,{value:t},e.children)},s={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},d=n.forwardRef((function(e,t){var r=e.components,a=e.mdxType,c=e.originalType,i=e.parentName,m=l(e,["components","mdxType","originalType","parentName"]),d=p(r),f=a,u=d["".concat(i,".").concat(f)]||d[f]||s[f]||c;return r?n.createElement(u,o(o({ref:t},m),{},{components:r})):n.createElement(u,o({ref:t},m))}));function f(e,t){var r=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var c=r.length,o=new Array(c);o[0]=d;var l={};for(var i in t)hasOwnProperty.call(t,i)&&(l[i]=t[i]);l.originalType=e,l.mdxType="string"==typeof e?e:a,o[1]=l;for(var p=2;p<c;p++)o[p]=r[p];return n.createElement.apply(null,o)}return n.createElement.apply(null,r)}d.displayName="MDXCreateElement"},1795:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>m,contentTitle:()=>i,default:()=>f,frontMatter:()=>l,metadata:()=>p,toc:()=>s});var n=r(4514),a=r(9994),c=(r(9901),r(7522)),o=["components"],l={},i=void 0,p={unversionedId:"contract-docs/ERC1820ImplementerInterface",id:"contract-docs/ERC1820ImplementerInterface",title:"ERC1820ImplementerInterface",description:"ERC1820ImplementerInterface",source:"@site/docs/contract-docs/ERC1820ImplementerInterface.md",sourceDirName:"contract-docs",slug:"/contract-docs/ERC1820ImplementerInterface",permalink:"/nft-launcher-contracts/docs/contract-docs/ERC1820ImplementerInterface",editUrl:"https://github.com/owlprotocol/solidity-cbor/docs/contract-docs/ERC1820ImplementerInterface.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"ERC1167Factory",permalink:"/nft-launcher-contracts/docs/contract-docs/ERC1167Factory"},next:{title:"ERC1820Registry",permalink:"/nft-launcher-contracts/docs/contract-docs/ERC1820Registry"}},m={},s=[{value:"ERC1820ImplementerInterface",id:"erc1820implementerinterface",level:2},{value:"canImplementInterfaceForAddress",id:"canimplementinterfaceforaddress",level:3}],d={toc:s};function f(e){var t=e.components,r=(0,a.Z)(e,o);return(0,c.kt)("wrapper",(0,n.Z)({},d,r,{components:t,mdxType:"MDXLayout"}),(0,c.kt)("h2",{id:"erc1820implementerinterface"},"ERC1820ImplementerInterface"),(0,c.kt)("p",null,(0,c.kt)("em",{parentName:"p"},"The interface a contract MUST implement if it is the implementer of\nsome (other) interface for any address other than itself.")),(0,c.kt)("h3",{id:"canimplementinterfaceforaddress"},"canImplementInterfaceForAddress"),(0,c.kt)("pre",null,(0,c.kt)("code",{parentName:"pre",className:"language-solidity"},"function canImplementInterfaceForAddress(bytes32 interfaceHash, address addr) external view returns (bytes32)\n")),(0,c.kt)("p",null,"Indicates whether the contract implements the interface ","'","interfaceHash","'"," for the address ","'","addr","'"," or not."),(0,c.kt)("table",null,(0,c.kt)("thead",{parentName:"table"},(0,c.kt)("tr",{parentName:"thead"},(0,c.kt)("th",{parentName:"tr",align:null},"Name"),(0,c.kt)("th",{parentName:"tr",align:null},"Type"),(0,c.kt)("th",{parentName:"tr",align:null},"Description"))),(0,c.kt)("tbody",{parentName:"table"},(0,c.kt)("tr",{parentName:"tbody"},(0,c.kt)("td",{parentName:"tr",align:null},"interfaceHash"),(0,c.kt)("td",{parentName:"tr",align:null},"bytes32"),(0,c.kt)("td",{parentName:"tr",align:null},"keccak256 hash of the name of the interface")),(0,c.kt)("tr",{parentName:"tbody"},(0,c.kt)("td",{parentName:"tr",align:null},"addr"),(0,c.kt)("td",{parentName:"tr",align:null},"address"),(0,c.kt)("td",{parentName:"tr",align:null},"Address for which the contract will implement the interface")))),(0,c.kt)("table",null,(0,c.kt)("thead",{parentName:"table"},(0,c.kt)("tr",{parentName:"thead"},(0,c.kt)("th",{parentName:"tr",align:null},"Name"),(0,c.kt)("th",{parentName:"tr",align:null},"Type"),(0,c.kt)("th",{parentName:"tr",align:null},"Description"))),(0,c.kt)("tbody",{parentName:"table"},(0,c.kt)("tr",{parentName:"tbody"},(0,c.kt)("td",{parentName:"tr",align:null},"[0]"),(0,c.kt)("td",{parentName:"tr",align:null},"bytes32"),(0,c.kt)("td",{parentName:"tr",align:null},"ERC1820_ACCEPT_MAGIC only if the contract implements ","'","interfaceHash","'"," for the address ","'","addr","'",".")))))}f.isMDXComponent=!0}}]);