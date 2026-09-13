import type { CartItem, ProductData } from "./data";
const KEY="katu.cart.v1";
export function readCart():CartItem[]{if(typeof window==="undefined")return[];try{const v=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(v)?v:[]}catch{return[]}}
export function saveCart(items:CartItem[]){if(typeof window==="undefined")return;localStorage.setItem(KEY,JSON.stringify(items));window.dispatchEvent(new CustomEvent("katu:cart",{detail:items}));}
export function addProductToCart(product:ProductData,quantity:number){const items=readCart();const found=items.find(x=>x.id===product.id);if(found)found.quantity+=quantity;else items.push({id:product.id,shop:product.store,title:product.title,spec:"默认规格",unit:product.price,quantity,imageLabel:product.imageLabel});saveCart(items);return items;}
export function cartQuantity(items=readCart()){return items.reduce((n,x)=>n+x.quantity,0)}
