"use strict";(self.webpackChunkowlprotocol_contracts_docs=self.webpackChunkowlprotocol_contracts_docs||[]).push([[187],{7522:(e,t,n)=>{n.d(t,{Zo:()=>s,kt:()=>m});var a=n(9901);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function l(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function o(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?l(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):l(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function d(e,t){if(null==e)return{};var n,a,r=function(e,t){if(null==e)return{};var n,a,r={},l=Object.keys(e);for(a=0;a<l.length;a++)n=l[a],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(e);for(a=0;a<l.length;a++)n=l[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var i=a.createContext({}),p=function(e){var t=a.useContext(i),n=t;return e&&(n="function"==typeof e?e(t):o(o({},t),e)),n},s=function(e){var t=p(e.components);return a.createElement(i.Provider,{value:t},e.children)},c={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},u=a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,l=e.originalType,i=e.parentName,s=d(e,["components","mdxType","originalType","parentName"]),u=p(n),m=r,g=u["".concat(i,".").concat(m)]||u[m]||c[m]||l;return n?a.createElement(g,o(o({ref:t},s),{},{components:n})):a.createElement(g,o({ref:t},s))}));function m(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var l=n.length,o=new Array(l);o[0]=u;var d={};for(var i in t)hasOwnProperty.call(t,i)&&(d[i]=t[i]);d.originalType=e,d.mdxType="string"==typeof e?e:r,o[1]=d;for(var p=2;p<l;p++)o[p]=n[p];return a.createElement.apply(null,o)}return a.createElement.apply(null,n)}u.displayName="MDXCreateElement"},8269:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>s,contentTitle:()=>i,default:()=>m,frontMatter:()=>d,metadata:()=>p,toc:()=>c});var a=n(4514),r=n(9994),l=(n(9901),n(7522)),o=["components"],d={},i=void 0,p={unversionedId:"contract-docs/ERC1967Upgrade",id:"contract-docs/ERC1967Upgrade",title:"ERC1967Upgrade",description:"ERC1967Upgrade",source:"@site/docs/contract-docs/ERC1967Upgrade.md",sourceDirName:"contract-docs",slug:"/contract-docs/ERC1967Upgrade",permalink:"/owlprotocol-contracts/docs/contract-docs/ERC1967Upgrade",editUrl:"https://github.com/owlprotocol/solidity-cbor/docs/contract-docs/ERC1967Upgrade.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"ERC1820Registry",permalink:"/owlprotocol-contracts/docs/contract-docs/ERC1820Registry"},next:{title:"ERC20Owl",permalink:"/owlprotocol-contracts/docs/contract-docs/ERC20Owl"}},s={},c=[{value:"ERC1967Upgrade",id:"erc1967upgrade",level:2},{value:"_ROLLBACK_SLOT",id:"_rollback_slot",level:3},{value:"_IMPLEMENTATION_SLOT",id:"_implementation_slot",level:3},{value:"Upgraded",id:"upgraded",level:3},{value:"_getImplementation",id:"_getimplementation",level:3},{value:"_setImplementation",id:"_setimplementation",level:3},{value:"_upgradeTo",id:"_upgradeto",level:3},{value:"_upgradeToAndCall",id:"_upgradetoandcall",level:3},{value:"_upgradeToAndCallUUPS",id:"_upgradetoandcalluups",level:3},{value:"_ADMIN_SLOT",id:"_admin_slot",level:3},{value:"AdminChanged",id:"adminchanged",level:3},{value:"_getAdmin",id:"_getadmin",level:3},{value:"_setAdmin",id:"_setadmin",level:3},{value:"_changeAdmin",id:"_changeadmin",level:3},{value:"_BEACON_SLOT",id:"_beacon_slot",level:3},{value:"BeaconUpgraded",id:"beaconupgraded",level:3},{value:"_getBeacon",id:"_getbeacon",level:3},{value:"_setBeacon",id:"_setbeacon",level:3},{value:"_upgradeBeaconToAndCall",id:"_upgradebeacontoandcall",level:3}],u={toc:c};function m(e){var t=e.components,n=(0,r.Z)(e,o);return(0,l.kt)("wrapper",(0,a.Z)({},u,n,{components:t,mdxType:"MDXLayout"}),(0,l.kt)("h2",{id:"erc1967upgrade"},"ERC1967Upgrade"),(0,l.kt)("p",null,"_This abstract contract provides getters and event emitting update functions for\n",(0,l.kt)("a",{parentName:"p",href:"https://eips.ethereum.org/EIPS/eip-1967%5BEIP1967%5D"},"https://eips.ethereum.org/EIPS/eip-1967[EIP1967]")," slots."),(0,l.kt)("p",null,"_Available since v4.1.__"),(0,l.kt)("h3",{id:"_rollback_slot"},"_ROLLBACK_SLOT"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"bytes32 _ROLLBACK_SLOT\n")),(0,l.kt)("h3",{id:"_implementation_slot"},"_IMPLEMENTATION_SLOT"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"bytes32 _IMPLEMENTATION_SLOT\n")),(0,l.kt)("p",null,(0,l.kt)("em",{parentName:"p"},"Storage slot with the address of the current implementation.\nThis is the keccak-256 hash of ",'"',"eip1967.proxy.implementation",'"'," subtracted by 1, and is\nvalidated in the constructor.")),(0,l.kt)("h3",{id:"upgraded"},"Upgraded"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"event Upgraded(address implementation)\n")),(0,l.kt)("p",null,(0,l.kt)("em",{parentName:"p"},"Emitted when the implementation is upgraded.")),(0,l.kt)("h3",{id:"_getimplementation"},"_getImplementation"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function _getImplementation() internal view returns (address)\n")),(0,l.kt)("p",null,(0,l.kt)("em",{parentName:"p"},"Returns the current implementation address.")),(0,l.kt)("h3",{id:"_setimplementation"},"_setImplementation"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function _setImplementation(address newImplementation) private\n")),(0,l.kt)("p",null,(0,l.kt)("em",{parentName:"p"},"Stores a new address in the EIP1967 implementation slot.")),(0,l.kt)("h3",{id:"_upgradeto"},"_upgradeTo"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function _upgradeTo(address newImplementation) internal\n")),(0,l.kt)("p",null,"_Perform implementation upgrade"),(0,l.kt)("p",null,"Emits an {Upgraded} event._"),(0,l.kt)("h3",{id:"_upgradetoandcall"},"_upgradeToAndCall"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function _upgradeToAndCall(address newImplementation, bytes data, bool forceCall) internal\n")),(0,l.kt)("p",null,"_Perform implementation upgrade with additional setup call."),(0,l.kt)("p",null,"Emits an {Upgraded} event._"),(0,l.kt)("h3",{id:"_upgradetoandcalluups"},"_upgradeToAndCallUUPS"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function _upgradeToAndCallUUPS(address newImplementation, bytes data, bool forceCall) internal\n")),(0,l.kt)("p",null,"_Perform implementation upgrade with security checks for UUPS proxies, and additional setup call."),(0,l.kt)("p",null,"Emits an {Upgraded} event._"),(0,l.kt)("h3",{id:"_admin_slot"},"_ADMIN_SLOT"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"bytes32 _ADMIN_SLOT\n")),(0,l.kt)("p",null,(0,l.kt)("em",{parentName:"p"},"Storage slot with the admin of the contract.\nThis is the keccak-256 hash of ",'"',"eip1967.proxy.admin",'"'," subtracted by 1, and is\nvalidated in the constructor.")),(0,l.kt)("h3",{id:"adminchanged"},"AdminChanged"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"event AdminChanged(address previousAdmin, address newAdmin)\n")),(0,l.kt)("p",null,(0,l.kt)("em",{parentName:"p"},"Emitted when the admin account has changed.")),(0,l.kt)("h3",{id:"_getadmin"},"_getAdmin"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function _getAdmin() internal view returns (address)\n")),(0,l.kt)("p",null,(0,l.kt)("em",{parentName:"p"},"Returns the current admin.")),(0,l.kt)("h3",{id:"_setadmin"},"_setAdmin"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function _setAdmin(address newAdmin) private\n")),(0,l.kt)("p",null,(0,l.kt)("em",{parentName:"p"},"Stores a new address in the EIP1967 admin slot.")),(0,l.kt)("h3",{id:"_changeadmin"},"_changeAdmin"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function _changeAdmin(address newAdmin) internal\n")),(0,l.kt)("p",null,"_Changes the admin of the proxy."),(0,l.kt)("p",null,"Emits an {AdminChanged} event._"),(0,l.kt)("h3",{id:"_beacon_slot"},"_BEACON_SLOT"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"bytes32 _BEACON_SLOT\n")),(0,l.kt)("p",null,(0,l.kt)("em",{parentName:"p"},"The storage slot of the UpgradeableBeacon contract which defines the implementation for this proxy.\nThis is bytes32(uint256(keccak256(","'","eip1967.proxy.beacon","'",")) - 1)) and is validated in the constructor.")),(0,l.kt)("h3",{id:"beaconupgraded"},"BeaconUpgraded"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"event BeaconUpgraded(address beacon)\n")),(0,l.kt)("p",null,(0,l.kt)("em",{parentName:"p"},"Emitted when the beacon is upgraded.")),(0,l.kt)("h3",{id:"_getbeacon"},"_getBeacon"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function _getBeacon() internal view returns (address)\n")),(0,l.kt)("p",null,(0,l.kt)("em",{parentName:"p"},"Returns the current beacon.")),(0,l.kt)("h3",{id:"_setbeacon"},"_setBeacon"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function _setBeacon(address newBeacon) private\n")),(0,l.kt)("p",null,(0,l.kt)("em",{parentName:"p"},"Stores a new beacon in the EIP1967 beacon slot.")),(0,l.kt)("h3",{id:"_upgradebeacontoandcall"},"_upgradeBeaconToAndCall"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-solidity"},"function _upgradeBeaconToAndCall(address newBeacon, bytes data, bool forceCall) internal\n")),(0,l.kt)("p",null,"_Perform beacon upgrade with additional setup call. Note: This upgrades the address of the beacon, it does\nnot upgrade the implementation contained in the beacon (see {UpgradeableBeacon-_setImplementation} for that)."),(0,l.kt)("p",null,"Emits a {BeaconUpgraded} event._"))}m.isMDXComponent=!0}}]);