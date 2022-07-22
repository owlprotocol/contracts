"use strict";(self.webpackChunkowlprotocol_contracts_docs=self.webpackChunkowlprotocol_contracts_docs||[]).push([[9238],{7522:(e,t,n)=>{n.d(t,{Zo:()=>s,kt:()=>m});var r=n(9901);function o(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function a(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function c(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?a(Object(n),!0).forEach((function(t){o(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):a(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function l(e,t){if(null==e)return{};var n,r,o=function(e,t){if(null==e)return{};var n,r,o={},a=Object.keys(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||(o[n]=e[n]);return o}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(o[n]=e[n])}return o}var i=r.createContext({}),p=function(e){var t=r.useContext(i),n=t;return e&&(n="function"==typeof e?e(t):c(c({},t),e)),n},s=function(e){var t=p(e.components);return r.createElement(i.Provider,{value:t},e.children)},u={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},d=r.forwardRef((function(e,t){var n=e.components,o=e.mdxType,a=e.originalType,i=e.parentName,s=l(e,["components","mdxType","originalType","parentName"]),d=p(n),m=o,k=d["".concat(i,".").concat(m)]||d[m]||u[m]||a;return n?r.createElement(k,c(c({ref:t},s),{},{components:n})):r.createElement(k,c({ref:t},s))}));function m(e,t){var n=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var a=n.length,c=new Array(a);c[0]=d;var l={};for(var i in t)hasOwnProperty.call(t,i)&&(l[i]=t[i]);l.originalType=e,l.mdxType="string"==typeof e?e:o,c[1]=l;for(var p=2;p<a;p++)c[p]=n[p];return r.createElement.apply(null,c)}return r.createElement.apply(null,n)}d.displayName="MDXCreateElement"},6113:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>s,contentTitle:()=>i,default:()=>m,frontMatter:()=>l,metadata:()=>p,toc:()=>u});var r=n(2875),o=n(358),a=(n(9901),n(7522)),c=["components"],l={},i=void 0,p={unversionedId:"contract-docs/RandomBeacon",id:"contract-docs/RandomBeacon",title:"RandomBeacon",description:"RandomBeacon",source:"@site/docs/contract-docs/RandomBeacon.md",sourceDirName:"contract-docs",slug:"/contract-docs/RandomBeacon",permalink:"/contracts/docs/contract-docs/RandomBeacon",draft:!1,editUrl:"https://github.com/owlprotocol/contracts/docs/contract-docs/RandomBeacon.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"ProxyUpgradeable",permalink:"/contracts/docs/contract-docs/ProxyUpgradeable"},next:{title:"Rent",permalink:"/contracts/docs/contract-docs/Rent"}},s={},u=[{value:"RandomBeacon",id:"randombeacon",level:2},{value:"EPOCH_PERIOD",id:"epoch_period",level:3},{value:"constructor",id:"constructor",level:3},{value:"getRandomness",id:"getrandomness",level:3},{value:"epochBlockLatest",id:"epochblocklatest",level:3},{value:"epochBlock",id:"epochblock",level:3}],d={toc:u};function m(e){var t=e.components,n=(0,o.Z)(e,c);return(0,a.kt)("wrapper",(0,r.Z)({},d,n,{components:t,mdxType:"MDXLayout"}),(0,a.kt)("h2",{id:"randombeacon"},"RandomBeacon"),(0,a.kt)("p",null,"abstract contract for all randomnes-generating contracts to implement.\nAll randomness-generating contracts must implement ",(0,a.kt)("inlineCode",{parentName:"p"},"getRandomness(uint256)")),(0,a.kt)("h3",{id:"epoch_period"},"EPOCH_PERIOD"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-solidity"},"uint8 EPOCH_PERIOD\n")),(0,a.kt)("h3",{id:"constructor"},"constructor"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-solidity"},"constructor(uint8 epochPeriod) internal\n")),(0,a.kt)("h3",{id:"getrandomness"},"getRandomness"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-solidity"},"function getRandomness(uint256 blockNumber) external view virtual returns (uint256)\n")),(0,a.kt)("p",null,"randomness will be generated in this function. Must be implemented\nin child."),(0,a.kt)("h3",{id:"epochblocklatest"},"epochBlockLatest"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-solidity"},"function epochBlockLatest() public view returns (uint256 currEpochBlock)\n")),(0,a.kt)("table",null,(0,a.kt)("thead",{parentName:"table"},(0,a.kt)("tr",{parentName:"thead"},(0,a.kt)("th",{parentName:"tr",align:null},"Name"),(0,a.kt)("th",{parentName:"tr",align:null},"Type"),(0,a.kt)("th",{parentName:"tr",align:null},"Description"))),(0,a.kt)("tbody",{parentName:"table"},(0,a.kt)("tr",{parentName:"tbody"},(0,a.kt)("td",{parentName:"tr",align:null},"currEpochBlock"),(0,a.kt)("td",{parentName:"tr",align:null},"uint256"),(0,a.kt)("td",{parentName:"tr",align:null},"when current block expires")))),(0,a.kt)("h3",{id:"epochblock"},"epochBlock"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-solidity"},"function epochBlock(uint256 blockNumber) public view returns (uint256)\n")),(0,a.kt)("p",null,"Return when epoch expires. Eg. blockNumber=0-99, period=100 => 100"))}m.isMDXComponent=!0}}]);