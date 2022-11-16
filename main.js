(()=>{"use strict";var n={951:(n,e,t)=>{t.r(e),t.d(e,{default:()=>r});const r=t.p+"main.css"},519:function(n,e,t){var r=this&&this.__awaiter||function(n,e,t,r){return new(t||(t=Promise))((function(o,i){function c(n){try{s(r.next(n))}catch(n){i(n)}}function a(n){try{s(r.throw(n))}catch(n){i(n)}}function s(n){var e;n.done?o(n.value):(e=n.value,e instanceof t?e:new t((function(n){n(e)}))).then(c,a)}s((r=r.apply(n,e||[])).next())}))},o=this&&this.__generator||function(n,e){var t,r,o,i,c={label:0,sent:function(){if(1&o[0])throw o[1];return o[1]},trys:[],ops:[]};return i={next:a(0),throw:a(1),return:a(2)},"function"==typeof Symbol&&(i[Symbol.iterator]=function(){return this}),i;function a(i){return function(a){return function(i){if(t)throw new TypeError("Generator is already executing.");for(;c;)try{if(t=1,r&&(o=2&i[0]?r.return:i[0]?r.throw||((o=r.return)&&o.call(r),0):r.next)&&!(o=o.call(r,i[1])).done)return o;switch(r=0,o&&(i=[2&i[0],o.value]),i[0]){case 0:case 1:o=i;break;case 4:return c.label++,{value:i[1],done:!1};case 5:c.label++,r=i[1],i=[0];continue;case 7:i=c.ops.pop(),c.trys.pop();continue;default:if(!((o=(o=c.trys).length>0&&o[o.length-1])||6!==i[0]&&2!==i[0])){c=0;continue}if(3===i[0]&&(!o||i[1]>o[0]&&i[1]<o[3])){c.label=i[1];break}if(6===i[0]&&c.label<o[1]){c.label=o[1],o=i;break}if(o&&c.label<o[2]){c.label=o[2],c.ops.push(i);break}o[2]&&c.ops.pop(),c.trys.pop();continue}i=e.call(n,c)}catch(n){i=[6,n],r=0}finally{t=o=0}if(5&i[0])throw i[1];return{value:i[0]?i[1]:void 0,done:!0}}([i,a])}}},i=this&&this.__spreadArray||function(n,e,t){if(t||2===arguments.length)for(var r,o=0,i=e.length;o<i;o++)!r&&o in e||(r||(r=Array.prototype.slice.call(e,0,o)),r[o]=e[o]);return n.concat(r||Array.prototype.slice.call(e))};Object.defineProperty(e,"__esModule",{value:!0}),t(951);var c=function(n,e){return r(void 0,void 0,void 0,(function(){return o(this,(function(t){switch(t.label){case 0:return[4,new Promise((function(t){return setTimeout((function(){t(null==e?void 0:e())}),n)}))];case 1:return[2,t.sent()]}}))}))},a=function(n,e){return void 0===e&&(e=document),e.querySelector(n)};r(void 0,void 0,void 0,(function(){var n,e,t,s,u,l,d,f,h,v,p,y,m,w,b,g,x,T,L,k,M,N,_,j;return o(this,(function(H){var S;return n=a(".app"),e=a(".helper"),t={},("[data-key]",void 0===S&&(S=document),Array.from(S.querySelectorAll("[data-key]"))).forEach((function(n){t[n.dataset.key]=n})),s=a(".attempts"),u=a(".overlay"),l={welcome:u.innerHTML,success:a('[data-modal="success"]').innerHTML,fail:a('[data-modal="fail"]').innerHTML},d=function(n){return r(void 0,void 0,void 0,(function(){return o(this,(function(e){return[2,window.fetch("https://api.dictionaryapi.dev/api/v2/entries/en/"+n).then((function(n){return n.json()})).then((function(n){return Array.isArray(n)&&n.length?n[0]:null})).catch((function(){return null}))]}))}))},h=[],(v=function(n){h=n,s.innerHTML='<div class="attempt">'.concat('<div class="char"><div class="body"><div class="front"></div><div class="back"></div></div></div>'.repeat(5),"</div>").repeat(6),Object.values(t).forEach((function(n){return n.classList.remove("yellow","green","none")}))})(["h","e","l","l","o"]),p={chars:[],index:0},y=function(n){p=n;for(var e=s.childNodes[p.index],t=0;t<5;t++){var r=p.chars[t],o=e.childNodes[t];a(".front",o).innerText=r||"",a(".back",o).innerText=r||""}},m={},w=function(n,e){return void 0===e&&(e=300),r(void 0,void 0,void 0,(function(){return o(this,(function(t){switch(t.label){case 0:return[4,Promise.all(i(i([],h.map((function(t,i){return r(void 0,void 0,void 0,(function(){return o(this,(function(t){return[2,c(i*e,(function(){console.log(n.childNodes[i]),n.childNodes[i].classList.add("flip")}))]}))}))})),!0),[c(7*e)],!1))];case 1:return[2,t.sent()]}}))}))},g=function(n){var e,t;void 0===n&&(n="cell"),b&&clearTimeout(b);var r=[null===(e=s.childNodes[p.index])||void 0===e?void 0:e.childNodes[p.chars.length]];"row"===n&&(r=Array.from(null===(t=s.childNodes[p.index])||void 0===t?void 0:t.childNodes)),r.forEach((function(n){return n.classList.add("horizontal-shake")})),b=setTimeout((function(){r.forEach((function(n){return n.classList.remove("horizontal-shake")}))}),500)},x=0,T=function(){return r(void 0,void 0,void 0,(function(){var n,e;return o(this,(function(t){switch(t.label){case 0:return[4,window.fetch("https://random-word-api.herokuapp.com/word?length=5").then((function(n){return n.json()})).then((function(n){return n[0]}))];case 1:return n=t.sent(),[4,d(n)];case 2:return(e=t.sent())?(f=e,v(n.split("")),[2]):x>5?(M("Still loading new word",!1),[2]):x>10?(M("Error loading new word",!1),[2]):(x++,T(),[2])}}))}))},L=function(){return r(void 0,void 0,void 0,(function(){return o(this,(function(n){switch(n.label){case 0:return u.innerHTML="",M("Loading new word",!1),[4,T()];case 1:return n.sent(),M("Loading new word"),y({index:0,chars:[]}),[2]}}))}))},M=function(n,t){void 0===t&&(t=!0),k&&clearTimeout(k),e.innerHTML=n,setTimeout((function(){e.style.opacity="1"}),1),t&&(k=setTimeout((function(){e.style.opacity="0",k=setTimeout((function(){e.innerHTML=""}),200)}),1500))},N=function(){return r(void 0,void 0,void 0,(function(){var n,e,r;return o(this,(function(o){switch(o.label){case 0:return p.chars.length<5?(g(),M("Not enough letters"),[2]):[4,d(p.chars.join(""))];case 1:return o.sent()?(n=s.childNodes[p.index],e=n.childNodes,r=0,p.chars.forEach((function(n,t){var o=e[t];h[t]===n?(m[n]="green",o.classList.add("green"),r++):h.includes(n)?(m[n]=m[n]||"yellow",o.classList.add("yellow")):(m[n]="none",o.classList.add("none"))})),[4,w(n)]):(g("row"),M("Not in word list"),[2]);case 2:return o.sent(),Object.entries(m).forEach((function(n){var e=n[0],r=n[1];t[e].classList.add(r)})),5===r&&(u.innerHTML=l.success,setTimeout((function(){a("[data-attempt-text]",u).innerText=" ".concat(p.index," ").concat(p.index?"attempts":"attempt")}),1)),p.index+1===6&&(u.innerHTML=l.fail),u.innerHTML&&(null==f?void 0:f.meanings)&&setTimeout((function(){a("[data-definition]",u).innerHTML="<h3>".concat(h.join(""),'</h3>\n<ul class="meanings">\n    ').concat(null==f?void 0:f.meanings.map((function(n){return'    \n    <li>\n        <p class="part-of-speech"><span>'.concat(n.partOfSpeech,"</span></p>\n        <ol>\n            ").concat(n.definitions.map((function(n){return"\n            <li>\n                <p>".concat(n.definition,"</p>\n                ").concat(n.example?'<p class="example">"'.concat(n.example,'"</p>'):"","\n            </li>")})).join(""),"\n        </ol>\n    </li>")})).join(""),"\n</ul>")}),1),y({chars:[],index:p.index+1}),[2]}}))}))},_=function(n){return r(void 0,void 0,void 0,(function(){var e,t;return o(this,(function(r){return"h1"===(e=n.target).nodeName.toLowerCase()?(u.innerHTML=l.welcome,[2]):"loadWord"===e.dataset.action?(L(),[2]):(t=e.dataset.key)?"backspace"===t?(p.chars.length?(p.chars.pop(),y(p)):g(),[2]):"enter"===t?(N(),[2]):(5===p.chars.length&&p.chars.pop(),p.chars.push(t),y(p),[2]):[2]}))}))},j=function(n){var e,t=(null===(e=document.cookie.match(new RegExp("(^| )__sordle__".concat("word","=([^;]+)"))))||void 0===e?void 0:e[2])||"";try{return JSON.parse(decodeURIComponent(t))}catch(n){return null}}(),j&&(u.innerHTML="",v(j.split(""))),n.addEventListener("click",_),[2]}))}))}},e={};function t(r){var o=e[r];if(void 0!==o)return o.exports;var i=e[r]={exports:{}};return n[r].call(i.exports,i,i.exports,t),i.exports}t.d=(n,e)=>{for(var r in e)t.o(e,r)&&!t.o(n,r)&&Object.defineProperty(n,r,{enumerable:!0,get:e[r]})},t.o=(n,e)=>Object.prototype.hasOwnProperty.call(n,e),t.r=n=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(n,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(n,"__esModule",{value:!0})},t.p="",t(519)})();