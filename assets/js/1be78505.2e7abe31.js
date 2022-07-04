"use strict";(self.webpackChunkowlprotocol_contracts_docs=self.webpackChunkowlprotocol_contracts_docs||[]).push([[514,867],{2118:(e,t,a)=>{a.r(t),a.d(t,{default:()=>ee});var n=a(9901),l=a(261),o=a(4698),r=a(7320),c=a(5789),i=a(1530),s=a(4514);function d(e){return n.createElement("svg",(0,s.Z)({width:"20",height:"20","aria-hidden":"true"},e),n.createElement("g",{fill:"#7a7a7a"},n.createElement("path",{d:"M9.992 10.023c0 .2-.062.399-.172.547l-4.996 7.492a.982.982 0 01-.828.454H1c-.55 0-1-.453-1-1 0-.2.059-.403.168-.551l4.629-6.942L.168 3.078A.939.939 0 010 2.528c0-.548.45-.997 1-.997h2.996c.352 0 .649.18.828.45L9.82 9.472c.11.148.172.347.172.55zm0 0"}),n.createElement("path",{d:"M19.98 10.023c0 .2-.058.399-.168.547l-4.996 7.492a.987.987 0 01-.828.454h-3c-.547 0-.996-.453-.996-1 0-.2.059-.403.168-.551l4.625-6.942-4.625-6.945a.939.939 0 01-.168-.55 1 1 0 01.996-.997h3c.348 0 .649.18.828.45l4.996 7.492c.11.148.168.347.168.55zm0 0"})))}var m=a(200);const u="collapseSidebarButton_YuCn",b="collapseSidebarButtonIcon_U9fZ";function p(e){var t=e.onClick;return n.createElement("button",{type:"button",title:(0,m.I)({id:"theme.docs.sidebar.collapseButtonTitle",message:"Collapse sidebar",description:"The title attribute for collapse button of doc sidebar"}),"aria-label":(0,m.I)({id:"theme.docs.sidebar.collapseButtonAriaLabel",message:"Collapse sidebar",description:"The title attribute for collapse button of doc sidebar"}),className:(0,c.Z)("button button--secondary button--outline",u),onClick:t},n.createElement(d,{className:b}))}var f=a(9994),h=a(7807),v=a(4058),E=a(2860);const _="menuHtmlItem_D46V",g="menuExternalLink_mrxl";var k=a(2143),C=["item"],S=["item","onItemClick","activePath","level","index"],I=["item","onItemClick","activePath","level","index"];function N(e){var t=e.item,a=(0,f.Z)(e,C);switch(t.type){case"category":return n.createElement(Z,(0,s.Z)({item:t},a));case"html":return n.createElement(T,(0,s.Z)({item:t},a));default:return n.createElement(M,(0,s.Z)({item:t},a))}}function Z(e){var t=e.item,a=e.onItemClick,l=e.activePath,o=e.level,i=e.index,d=(0,f.Z)(e,S),u=t.items,b=t.label,p=t.collapsible,v=t.className,E=t.href,_=function(e){var t=(0,k.Z)();return(0,n.useMemo)((function(){return e.href?e.href:!t&&e.collapsible?(0,r.Wl)(e):void 0}),[e,t])}(t),g=(0,r._F)(t,l),C=(0,r.Mg)(E,l),I=(0,r.uR)({initialState:function(){return!!p&&(!g&&t.collapsed)}}),N=I.collapsed,Z=I.setCollapsed;!function(e){var t=e.isActive,a=e.collapsed,l=e.setCollapsed,o=(0,r.D9)(t);(0,n.useEffect)((function(){t&&!o&&a&&l(!1)}),[t,o,a,l])}({isActive:g,collapsed:N,setCollapsed:Z});var T=(0,r.fP)(),M=T.expandedItem,y=T.setExpandedItem;function x(e){void 0===e&&(e=!N),y(e?null:i),Z(e)}var A=(0,r.LU)().autoCollapseSidebarCategories;return(0,n.useEffect)((function(){p&&M&&M!==i&&A&&Z(!0)}),[p,M,i,Z,A]),n.createElement("li",{className:(0,c.Z)(r.kM.docs.docSidebarItemCategory,r.kM.docs.docSidebarItemCategoryLevel(o),"menu__list-item",{"menu__list-item--collapsed":N},v)},n.createElement("div",{className:(0,c.Z)("menu__list-item-collapsible",{"menu__list-item-collapsible--active":C})},n.createElement(h.Z,(0,s.Z)({className:(0,c.Z)("menu__link",{"menu__link--sublist":p,"menu__link--sublist-caret":!E,"menu__link--active":g}),onClick:p?function(e){null==a||a(t),E?x(!1):(e.preventDefault(),x())}:function(){null==a||a(t)},"aria-current":C?"page":void 0,"aria-expanded":p?!N:void 0,href:p?null!=_?_:"#":_},d),b),E&&p&&n.createElement("button",{"aria-label":(0,m.I)({id:"theme.DocSidebarItem.toggleCollapsedCategoryAriaLabel",message:"Toggle the collapsible sidebar category '{label}'",description:"The ARIA label to toggle the collapsible sidebar category"},{label:b}),type:"button",className:"clean-btn menu__caret",onClick:function(e){e.preventDefault(),x()}})),n.createElement(r.zF,{lazy:!0,as:"ul",className:"menu__list",collapsed:N},n.createElement(L,{items:u,tabIndex:N?-1:0,onItemClick:a,activePath:l,level:o+1})))}function T(e){var t=e.item,a=e.level,l=e.index,o=t.value,i=t.defaultStyle,s=t.className;return n.createElement("li",{className:(0,c.Z)(r.kM.docs.docSidebarItemLink,r.kM.docs.docSidebarItemLinkLevel(a),i&&_+" menu__list-item",s),key:l,dangerouslySetInnerHTML:{__html:o}})}function M(e){var t=e.item,a=e.onItemClick,l=e.activePath,o=e.level,i=(e.index,(0,f.Z)(e,I)),d=t.href,m=t.label,u=t.className,b=(0,r._F)(t,l),p=(0,v.Z)(d);return n.createElement("li",{className:(0,c.Z)(r.kM.docs.docSidebarItemLink,r.kM.docs.docSidebarItemLinkLevel(o),"menu__list-item",u),key:m},n.createElement(h.Z,(0,s.Z)({className:(0,c.Z)("menu__link",!p&&g,{"menu__link--active":b}),"aria-current":b?"page":void 0,to:d},p&&{onClick:a?function(){return a(t)}:void 0},i),m,!p&&n.createElement(E.Z,null)))}var y=["items"];function x(e){var t=e.items,a=(0,f.Z)(e,y);return n.createElement(r.D_,null,t.map((function(e,t){return n.createElement(N,(0,s.Z)({key:t,item:e,index:t},a))})))}const L=(0,n.memo)(x),A="menu_U05I",F="menuWithAnnouncementBar_BhRN";function P(e){var t=e.path,a=e.sidebar,l=e.className,o=function(){var e=(0,r.nT)().isActive,t=(0,n.useState)(e),a=t[0],l=t[1];return(0,r.RF)((function(t){var a=t.scrollY;e&&l(0===a)}),[e]),e&&a}();return n.createElement("nav",{className:(0,c.Z)("menu thin-scrollbar",A,o&&F,l)},n.createElement("ul",{className:(0,c.Z)(r.kM.docs.docSidebarMenu,"menu__list")},n.createElement(L,{items:a,activePath:t,level:1})))}const w="sidebar_Pm6O",B="sidebarWithHideableNavbar_ZtUM",R="sidebarHidden_vR9A",H="sidebarLogo_VMaI";function D(e){var t=e.path,a=e.sidebar,l=e.onCollapse,o=e.isHidden,s=(0,r.LU)(),d=s.navbar.hideOnScroll,m=s.hideableSidebar;return n.createElement("div",{className:(0,c.Z)(w,d&&B,o&&R)},d&&n.createElement(i.Z,{tabIndex:-1,className:H}),n.createElement(P,{path:t,sidebar:a}),m&&n.createElement(p,{onClick:l}))}const W=n.memo(D);var U=function(e){var t=e.sidebar,a=e.path,l=(0,r.el)();return n.createElement("ul",{className:(0,c.Z)(r.kM.docs.docSidebarMenu,"menu__list")},n.createElement(L,{items:t,activePath:a,onItemClick:function(e){"category"===e.type&&e.href&&l.toggle(),"link"===e.type&&l.toggle()},level:1}))};function q(e){return n.createElement(r.Zo,{component:U,props:e})}const z=n.memo(q);function Y(e){var t=(0,r.iP)(),a="desktop"===t||"ssr"===t,l="mobile"===t;return n.createElement(n.Fragment,null,a&&n.createElement(W,e),l&&n.createElement(z,e))}var G=a(1867);const O="backToTopButton_HlL3",V="backToTopButtonShow_rv2K";function X(){var e=(0,n.useRef)(null);return{smoothScrollTop:function(){var t;e.current=(t=null,function e(){var a=document.documentElement.scrollTop;a>0&&(t=requestAnimationFrame(e),window.scrollTo(0,Math.floor(.85*a)))}(),function(){return t&&cancelAnimationFrame(t)})},cancelScrollToTop:function(){return null==e.current?void 0:e.current()}}}function K(){var e=(0,n.useState)(!1),t=e[0],a=e[1],l=(0,n.useRef)(!1),o=X(),i=o.smoothScrollTop,s=o.cancelScrollToTop;return(0,r.RF)((function(e,t){var n=e.scrollY,o=null==t?void 0:t.scrollY;if(o)if(l.current)l.current=!1;else{var r=n<o;if(r||s(),n<300)a(!1);else if(r){var c=document.documentElement.scrollHeight;n+window.innerHeight<c&&a(!0)}else a(!1)}})),(0,r.SL)((function(e){e.location.hash&&(l.current=!0,a(!1))})),n.createElement("button",{"aria-label":(0,m.I)({id:"theme.BackToTopButton.buttonAriaLabel",message:"Scroll back to top",description:"The ARIA label for the back to top button"}),className:(0,c.Z)("clean-btn",r.kM.common.backToTopButton,O,t&&V),type:"button",onClick:function(){return i()}})}var j=a(5912);const J={docPage:"docPage_Pmy7",docMainContainer:"docMainContainer_XqUF",docSidebarContainer:"docSidebarContainer_GsOu",docMainContainerEnhanced:"docMainContainerEnhanced_sAg3",docSidebarContainerHidden:"docSidebarContainerHidden_ktFf",collapsedDocSidebar:"collapsedDocSidebar_R0ib",expandSidebarButtonIcon:"expandSidebarButtonIcon_GjaC",docItemWrapperEnhanced:"docItemWrapperEnhanced_oXen"};var Q=a(9871);function $(e){var t=e.currentDocRoute,a=e.versionMetadata,l=e.children,i=e.sidebarName,s=(0,r.Vq)(),u=a.pluginId,b=a.version,p=(0,n.useState)(!1),f=p[0],h=p[1],v=(0,n.useState)(!1),E=v[0],_=v[1],g=(0,n.useCallback)((function(){E&&_(!1),h((function(e){return!e}))}),[E]);return n.createElement(n.Fragment,null,n.createElement(Q.Z,{version:b,tag:(0,r.os)(u,b)}),n.createElement(o.Z,null,n.createElement("div",{className:J.docPage},n.createElement(K,null),s&&n.createElement("aside",{className:(0,c.Z)(r.kM.docs.docSidebarContainer,J.docSidebarContainer,f&&J.docSidebarContainerHidden),onTransitionEnd:function(e){e.currentTarget.classList.contains(J.docSidebarContainer)&&f&&_(!0)}},n.createElement(Y,{key:i,sidebar:s,path:t.path,onCollapse:g,isHidden:E}),E&&n.createElement("div",{className:J.collapsedDocSidebar,title:(0,m.I)({id:"theme.docs.sidebar.expandButtonTitle",message:"Expand sidebar",description:"The ARIA label and title attribute for expand button of doc sidebar"}),"aria-label":(0,m.I)({id:"theme.docs.sidebar.expandButtonAriaLabel",message:"Expand sidebar",description:"The ARIA label and title attribute for expand button of doc sidebar"}),tabIndex:0,role:"button",onKeyDown:g,onClick:g},n.createElement(d,{className:J.expandSidebarButtonIcon}))),n.createElement("main",{className:(0,c.Z)(J.docMainContainer,(f||!s)&&J.docMainContainerEnhanced)},n.createElement("div",{className:(0,c.Z)("container padding-top--md padding-bottom--lg",J.docItemWrapper,f&&J.docItemWrapperEnhanced)},l)))))}function ee(e){var t=e.route.routes,a=e.versionMetadata,o=e.location,i=t.find((function(e){return(0,j.LX)(o.pathname,e)}));if(!i)return n.createElement(G.default,null);var s=i.sidebar,d=s?a.docsSidebars[s]:null;return n.createElement(r.FG,{className:(0,c.Z)(r.kM.wrapper.docsPages,r.kM.page.docsDocPage,a.className)},n.createElement(r.qu,{version:a},n.createElement(r.bT,{sidebar:null!=d?d:null},n.createElement($,{currentDocRoute:i,versionMetadata:a,sidebarName:s},(0,l.H)(t,{versionMetadata:a})))))}},1867:(e,t,a)=>{a.r(t),a.d(t,{default:()=>c});var n=a(9901),l=a(4698),o=a(200),r=a(7320);function c(){return n.createElement(n.Fragment,null,n.createElement(r.d,{title:(0,o.I)({id:"theme.NotFound.title",message:"Page Not Found"})}),n.createElement(l.Z,null,n.createElement("main",{className:"container margin-vert--xl"},n.createElement("div",{className:"row"},n.createElement("div",{className:"col col--6 col--offset-3"},n.createElement("h1",{className:"hero__title"},n.createElement(o.Z,{id:"theme.NotFound.title",description:"The title of the 404 page"},"Page Not Found")),n.createElement("p",null,n.createElement(o.Z,{id:"theme.NotFound.p1",description:"The first paragraph of the 404 page"},"We could not find what you were looking for.")),n.createElement("p",null,n.createElement(o.Z,{id:"theme.NotFound.p2",description:"The 2nd paragraph of the 404 page"},"Please contact the owner of the site that linked you to the original URL and let them know their link is broken.")))))))}}}]);