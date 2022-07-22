"use strict";(self.webpackChunkowlprotocol_contracts_docs=self.webpackChunkowlprotocol_contracts_docs||[]).push([[8459],{7522:(e,t,n)=>{n.d(t,{Zo:()=>u,kt:()=>y});var r=n(9901);function o(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function c(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function a(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?c(Object(n),!0).forEach((function(t){o(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):c(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function i(e,t){if(null==e)return{};var n,r,o=function(e,t){if(null==e)return{};var n,r,o={},c=Object.keys(e);for(r=0;r<c.length;r++)n=c[r],t.indexOf(n)>=0||(o[n]=e[n]);return o}(e,t);if(Object.getOwnPropertySymbols){var c=Object.getOwnPropertySymbols(e);for(r=0;r<c.length;r++)n=c[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(o[n]=e[n])}return o}var s=r.createContext({}),l=function(e){var t=r.useContext(s),n=t;return e&&(n="function"==typeof e?e(t):a(a({},t),e)),n},u=function(e){var t=l(e.components);return r.createElement(s.Provider,{value:t},e.children)},p={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},d=r.forwardRef((function(e,t){var n=e.components,o=e.mdxType,c=e.originalType,s=e.parentName,u=i(e,["components","mdxType","originalType","parentName"]),d=l(n),y=o,f=d["".concat(s,".").concat(y)]||d[y]||p[y]||c;return n?r.createElement(f,a(a({ref:t},u),{},{components:n})):r.createElement(f,a({ref:t},u))}));function y(e,t){var n=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var c=n.length,a=new Array(c);a[0]=d;var i={};for(var s in t)hasOwnProperty.call(t,s)&&(i[s]=t[s]);i.originalType=e,i.mdxType="string"==typeof e?e:o,a[1]=i;for(var l=2;l<c;l++)a[l]=n[l];return r.createElement.apply(null,a)}return r.createElement.apply(null,n)}d.displayName="MDXCreateElement"},7822:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>u,contentTitle:()=>s,default:()=>y,frontMatter:()=>i,metadata:()=>l,toc:()=>p});var r=n(2875),o=n(358),c=(n(9901),n(7522)),a=["components"],i={},s=void 0,l={unversionedId:"contract-docs/AuctionLib",id:"contract-docs/AuctionLib",title:"AuctionLib",description:"AuctionLib",source:"@site/docs/contract-docs/AuctionLib.md",sourceDirName:"contract-docs",slug:"/contract-docs/AuctionLib",permalink:"/contracts/docs/contract-docs/AuctionLib",draft:!1,editUrl:"https://github.com/owlprotocol/contracts/docs/contract-docs/AuctionLib.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"AcceptEverythingPaymaster",permalink:"/contracts/docs/contract-docs/AcceptEverythingPaymaster"},next:{title:"BeaconProxyInitializable",permalink:"/contracts/docs/contract-docs/BeaconProxyInitializable"}},u={},p=[{value:"AuctionLib",id:"auctionlib",level:2},{value:"TokenType",id:"tokentype",level:3},{value:"Asset",id:"asset",level:3}],d={toc:p};function y(e){var t=e.components,n=(0,o.Z)(e,a);return(0,c.kt)("wrapper",(0,r.Z)({},d,n,{components:t,mdxType:"MDXLayout"}),(0,c.kt)("h2",{id:"auctionlib"},"AuctionLib"),(0,c.kt)("p",null,"Basic auction structures used through auction contracts."),(0,c.kt)("h3",{id:"tokentype"},"TokenType"),(0,c.kt)("pre",null,(0,c.kt)("code",{parentName:"pre",className:"language-solidity"},"enum TokenType {\n  erc721,\n  erc1155\n}\n")),(0,c.kt)("h3",{id:"asset"},"Asset"),(0,c.kt)("pre",null,(0,c.kt)("code",{parentName:"pre",className:"language-solidity"},"struct Asset {\n  enum AuctionLib.TokenType token;\n  address contractAddr;\n  uint256 tokenId;\n}\n")))}y.isMDXComponent=!0}}]);