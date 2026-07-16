document.addEventListener("DOMContentLoaded", () => {
  "use strict";
  const data = typeof products !== "undefined" && Array.isArray(products) ? products : [];
  const categoryData = typeof categories !== "undefined" && Array.isArray(categories) ? categories : [];
  const store = window.TabanjiStore;
  const $ = (id) => document.getElementById(id);
  const els = {
    grid:$("productGrid"), empty:$("emptyState"), count:$("resultCount"), breadcrumb:$("breadcrumb"), title:$("pageTitle"),
    description:$("pageDescription"), form:$("filtersForm"), brands:$("brandFilters"), ratings:$("ratingFilters"),
    badges:$("badgeFilters"), sellers:$("sellerFilters"), min:$("minPrice"), max:$("maxPrice"), stock:$("inStockFilter"),
    discount:$("discountFilter"), sort:$("sortSelect"), pageSize:$("pageSize"), pagination:$("pagination"),
    chips:$("activeFilters"), panel:$("filtersPanel"), filterOverlay:$("filterOverlay"), openFilters:$("openFilters"),
    closeFilters:$("closeFilters"), clear:$("clearFilters"), emptyClear:$("emptyClear"), apply:$("applyFilters"),
    gridView:$("gridView"), listView:$("listView"), search:$("productSearch"), searchForm:$("headerSearch"),
    suggestions:$("searchSuggestions"), toast:$("toast"), menu:$("siteDrawer"), menuOverlay:$("menuOverlay"),
    openMenu:$("openMenu"), closeMenu:$("closeMenu"), theme:$("themeToggle"), drawerTheme:$("drawerTheme")
  };
  if (!els.grid) return;

  const params = new URLSearchParams(location.search);
  const csvSet = (name) => new Set((params.get(name) || "").split(",").map(v => v.trim()).filter(Boolean));
  const allowedPageSizes = [12,24,48];
  const state = {
    category:params.get("category") || "", subcategory:params.get("subcategory") || "", search:params.get("search") || "",
    brands:csvSet("brand"), badges:csvSet("badge"), sellers:csvSet("seller"),
    minPrice:Number(params.get("minPrice")) || null, maxPrice:Number(params.get("maxPrice")) || null,
    rating:Number(params.get("rating")) || 0, inStock:params.get("inStock")==="1", discount:params.get("discount")==="1",
    sort:["popular","newest","price-asc","price-desc","rating","discount"].includes(params.get("sort")) ? params.get("sort") : "popular",
    view:params.get("view")==="list" ? "list" : "grid", page:Math.max(1,Number(params.get("page"))||1),
    pageSize:allowedPageSizes.includes(Number(params.get("pageSize"))) ? Number(params.get("pageSize")) : 12
  };
  let searchMatches=[], suggestionIndex=-1, toastTimer, lastDrawerFocus;
  const slugify = value => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/&/g," and ").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
  const money = (value,currency="USD") => new Intl.NumberFormat("en-US",{style:"currency",currency,maximumFractionDigits:0}).format(value);
  const discountPercent = product => product.oldPrice ? Math.round((1-product.price/product.oldPrice)*100) : 0;
  function el(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node}
  function link(text,href,className){const node=el("a",className,text);node.href=href;return node}
  function showToast(message){if(!els.toast)return;els.toast.textContent=message;els.toast.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>els.toast.classList.remove("show"),2600)}

  function categoryInfo(){
    return categoryData.find(item=>item.id===state.category) || null;
  }
  function invalidRoute(){
    if(state.category && !data.some(p=>p.categoryId===state.category)) return true;
    if(state.subcategory && !state.category) return true;
    if(state.subcategory && !data.some(p=>p.categoryId===state.category&&p.subcategorySlug===state.subcategory)) return true;
    return false;
  }
  function routeProducts(){
    if(invalidRoute()) return [];
    return data.filter(product => {
      if(state.category && product.categoryId!==state.category)return false;
      if(state.subcategory && product.subcategorySlug!==state.subcategory)return false;
      if(state.search){const q=state.search.toLocaleLowerCase();const hay=[product.title,product.brand,product.shortDescription,product.sku].join(" ").toLocaleLowerCase();if(!hay.includes(q))return false}
      return true;
    });
  }
  function filteredProducts(){
    return routeProducts().filter(product => {
      if(state.brands.size&&!state.brands.has(product.brand))return false;
      if(state.badges.size&&!state.badges.has(product.badge||""))return false;
      if(state.sellers.size&&!state.sellers.has(product.seller))return false;
      if(state.minPrice!==null&&product.price<state.minPrice)return false;
      if(state.maxPrice!==null&&product.price>state.maxPrice)return false;
      if(state.rating&&product.rating<state.rating)return false;
      if(state.inStock&&!product.inStock)return false;
      if(state.discount&&!product.oldPrice)return false;
      return true;
    });
  }
  function sortedProducts(items){
    const result=[...items];
    const sorters={
      popular:(a,b)=>b.popularity-a.popularity,newest:(a,b)=>new Date(b.createdAt)-new Date(a.createdAt),
      "price-asc":(a,b)=>a.price-b.price,"price-desc":(a,b)=>b.price-a.price,
      rating:(a,b)=>b.rating-a.rating,discount:(a,b)=>discountPercent(b)-discountPercent(a)
    };
    return result.sort(sorters[state.sort]);
  }
  function syncUrl(){
    const next=new URLSearchParams();
    const set=(key,value)=>{if(value!==""&&value!==null&&value!==false&&value!==0)next.set(key,String(value))};
    set("category",state.category);set("subcategory",state.subcategory);set("search",state.search);
    if(state.brands.size)next.set("brand",[...state.brands].join(","));
    set("minPrice",state.minPrice);set("maxPrice",state.maxPrice);set("rating",state.rating);
    set("inStock",state.inStock?1:"");set("discount",state.discount?1:"");
    if(state.badges.size)next.set("badge",[...state.badges].join(","));
    if(state.sellers.size)next.set("seller",[...state.sellers].join(","));
    if(state.sort!=="popular")set("sort",state.sort);if(state.view!=="grid")set("view",state.view);
    if(state.page!==1)set("page",state.page);if(state.pageSize!==12)set("pageSize",state.pageSize);
    history.replaceState(null,"",location.pathname+(next.size?"?"+next.toString():""));
  }

  function renderHeading(){
    const info=categoryInfo();const subName=state.subcategory?state.subcategory.split("-").map(w=>w[0]?.toUpperCase()+w.slice(1)).join(" "):"";
    els.breadcrumb.replaceChildren(link("Home","index.html"),el("span","","/"),link("Catalog","catalog.html"));
    if(state.category){els.breadcrumb.append(el("span","","/"),link(info?.title||state.category,"products.html?category="+encodeURIComponent(state.category)))}
    if(subName)els.breadcrumb.append(el("span","","/"),el("span","",subName));
    if(invalidRoute()){els.title.textContent="Catalog section not found";els.description.textContent="This category or subcategory does not exist.";return}
    if(state.search){els.title.textContent='Search results for “'+state.search+'”';els.description.textContent="Products matching title, brand, description or SKU.";return}
    if(subName){els.title.textContent=subName;els.description.textContent="Explore "+subName.toLowerCase()+" selected by TABANJI.";return}
    if(info){els.title.textContent=info.title;els.description.textContent=info.description;return}
    els.title.textContent="All products";els.description.textContent="Browse the complete TABANJI selection.";
  }
  function countMap(items,key){const map=new Map();items.forEach(item=>{const value=item[key];if(value)map.set(value,(map.get(value)||0)+1)});return map}
  function createCheck(name,value,count,checked){
    const label=el("label","check");const input=el("input");input.type="checkbox";input.name=name;input.value=value;input.checked=checked;
    label.append(input,el("span","",value),el("small","",String(count)));return label;
  }
  function renderFilterOptions(){
    const base=routeProducts();const brandCounts=countMap(base,"brand"),badgeCounts=countMap(base,"badge"),sellerCounts=countMap(base,"seller");
    els.brands.replaceChildren(...[...brandCounts].sort().map(([v,c])=>createCheck("brand",v,c,state.brands.has(v))));
    els.badges.replaceChildren(...[...badgeCounts].sort().map(([v,c])=>createCheck("badge",v,c,state.badges.has(v))));
    els.sellers.replaceChildren(...[...sellerCounts].sort().map(([v,c])=>createCheck("seller",v,c,state.sellers.has(v))));
    const ratings=[4.5,4,3].map(value=>{const count=base.filter(p=>p.rating>=value).length;const label=el("label","check");const input=el("input");input.type="radio";input.name="rating";input.value=String(value);input.checked=state.rating===value;label.append(input,el("span","",value+"★ & up"),el("small","",String(count)));return label});
    const any=el("label","check");const anyInput=el("input");anyInput.type="radio";anyInput.name="rating";anyInput.value="0";anyInput.checked=!state.rating;any.append(anyInput,el("span","","Any rating"),el("small","",String(base.length)));els.ratings.replaceChildren(any,...ratings);
    $("inStockCount").textContent=String(base.filter(p=>p.inStock).length);$("discountCount").textContent=String(base.filter(p=>p.oldPrice).length);
  }
  function readForm(){
    state.minPrice=els.min.value===""?null:Math.max(0,Number(els.min.value)||0);state.maxPrice=els.max.value===""?null:Math.max(0,Number(els.max.value)||0);
    state.brands=new Set([...els.form.querySelectorAll('input[name="brand"]:checked')].map(i=>i.value));
    state.badges=new Set([...els.form.querySelectorAll('input[name="badge"]:checked')].map(i=>i.value));
    state.sellers=new Set([...els.form.querySelectorAll('input[name="seller"]:checked')].map(i=>i.value));
    state.rating=Number(els.form.querySelector('input[name="rating"]:checked')?.value)||0;state.inStock=els.stock.checked;state.discount=els.discount.checked;state.page=1;
  }
  function fillForm(){els.min.value=state.minPrice??"";els.max.value=state.maxPrice??"";els.stock.checked=state.inStock;els.discount.checked=state.discount;els.sort.value=state.sort;els.pageSize.value=String(state.pageSize)}
  function clearFilters(){
    state.brands.clear();state.badges.clear();state.sellers.clear();state.minPrice=null;state.maxPrice=null;state.rating=0;state.inStock=false;state.discount=false;state.page=1;
    fillForm();renderFilterOptions();renderAll();
  }
  function renderChips(){
    const values=[];state.brands.forEach(v=>values.push(["brand",v]));state.badges.forEach(v=>values.push(["badge",v]));state.sellers.forEach(v=>values.push(["seller",v]));
    if(state.minPrice!==null)values.push(["minPrice","From "+money(state.minPrice)]);if(state.maxPrice!==null)values.push(["maxPrice","To "+money(state.maxPrice)]);
    if(state.rating)values.push(["rating",state.rating+"★ & up"]);if(state.inStock)values.push(["inStock","In stock"]);if(state.discount)values.push(["discount","Discounted"]);
    els.chips.replaceChildren(...values.map(([type,label])=>{const button=el("button","filter-chip",label+" ×");button.type="button";button.dataset.removeFilter=type;button.dataset.value=label;return button}));
    $("mobileFilterCount").textContent=values.length?"("+values.length+")":"";$("filterResultCount").textContent=filteredProducts().length+" matching products";
  }
  function removeChip(type,label){
    if(type==="brand")state.brands.delete(label);else if(type==="badge")state.badges.delete(label);else if(type==="seller")state.sellers.delete(label);
    else if(type==="minPrice")state.minPrice=null;else if(type==="maxPrice")state.maxPrice=null;else if(type==="rating")state.rating=0;else if(type==="inStock")state.inStock=false;else if(type==="discount")state.discount=false;
    state.page=1;fillForm();renderFilterOptions();renderAll();
  }

  function fallbackImage(){
    return "data:image/svg+xml;charset=UTF-8,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="100%" height="100%" fill="#dfe5ee"/><text x="50%" y="48%" text-anchor="middle" font-size="70">📦</text><text x="50%" y="65%" text-anchor="middle" font-family="Arial" font-size="24" fill="#667085">Image unavailable</text></svg>');
  }
  function productCard(product){
    const card=el("article","product-card");card.dataset.productId=product.id;
    const main=link("","product.html?id="+encodeURIComponent(product.id),"product-main");main.setAttribute("aria-label","View "+product.title);
    const imageWrap=el("div","product-image-wrap");const image=el("img","product-image");image.src=product.image;image.alt=product.title;image.loading="lazy";image.addEventListener("error",()=>{image.src=fallbackImage()},{once:true});
    if(product.badge)imageWrap.append(el("span","badge",product.badge));imageWrap.append(image);
    const actions=el("div","card-actions");const fav=el("button","card-action","♡");fav.type="button";fav.dataset.action="favorite";fav.setAttribute("aria-label","Add "+product.title+" to favorites");
    const compare=el("button","card-action","⇄");compare.type="button";compare.dataset.action="compare";compare.setAttribute("aria-label","Compare "+product.title);actions.append(fav,compare);imageWrap.append(actions);
    const body=el("div","product-body");body.append(el("span","product-brand",product.brand),el("div","product-title",product.title));
    const specs=Object.entries(product.specifications).slice(0,2).map(([k,v])=>k+": "+v).join(" · ");body.append(el("div","spec-line",specs));
    const rating=el("div","rating","★ "+product.rating+" ");rating.append(el("small","", "("+product.reviewCount+" reviews)"));body.append(rating);
    const prices=el("div","price-block");prices.append(el("div","old-price",product.oldPrice?money(product.oldPrice,product.currency):""));
    const current=el("div","price",money(product.price,product.currency));if(product.oldPrice)current.append(el("span","discount","−"+discountPercent(product)+"%"));prices.append(current);body.append(prices);
    body.append(el("div","stock"+(product.inStock?"":" out"),product.inStock?"In stock · "+product.stockCount+" available":"Out of stock"),el("div","seller","Seller: "+product.seller));
    main.append(imageWrap,body);const cart=el("button","add-cart",product.inStock?"Add to cart":"Out of stock");cart.type="button";cart.dataset.action="cart";cart.disabled=!product.inStock;
    card.append(main,cart);refreshCardState(card,product);return card;
  }
  function refreshCardState(card,product){
    if(!store)return;const fav=card.querySelector('[data-action="favorite"]'),compare=card.querySelector('[data-action="compare"]');
    const favorite=store.isFavorite(product.id),compared=store.isCompared(product.id);fav.classList.toggle("active",favorite);fav.textContent=favorite?"♥":"♡";fav.setAttribute("aria-pressed",String(favorite));
    compare.classList.toggle("active",compared);compare.setAttribute("aria-pressed",String(compared));
  }
  function renderProducts(){
    const all=sortedProducts(filteredProducts());const pages=Math.max(1,Math.ceil(all.length/state.pageSize));state.page=Math.min(state.page,pages);
    const start=(state.page-1)*state.pageSize;const shown=all.slice(start,start+state.pageSize);els.count.textContent=String(all.length);
    els.grid.classList.toggle("list-view",state.view==="list");els.grid.hidden=!shown.length;els.empty.hidden=shown.length>0;
    els.grid.replaceChildren(...shown.map(productCard));renderPagination(pages);renderChips();
  }
  function renderPagination(pages){
    const buttons=[];const make=(label,page,disabled,current=false)=>{const b=el("button","page-btn",label);b.type="button";b.dataset.page=String(page);b.disabled=disabled;if(current){b.classList.add("current");b.setAttribute("aria-current","page")}return b};
    buttons.push(make("Previous",state.page-1,state.page===1));let start=Math.max(1,state.page-2),end=Math.min(pages,start+4);start=Math.max(1,end-4);
    for(let i=start;i<=end;i++)buttons.push(make(String(i),i,false,i===state.page));buttons.push(make("Next",state.page+1,state.page===pages));els.pagination.replaceChildren(...buttons);
  }
  function renderAll(){syncUrl();renderHeading();renderProducts()}

  function openLayer(panel,overlay,button){overlay.hidden=false;requestAnimationFrame(()=>overlay.classList.add("visible"));panel.classList.add("open");panel.setAttribute("aria-hidden","false");button?.setAttribute("aria-expanded","true");document.body.classList.add("drawer-open")}
  function closeLayer(panel,overlay,button){panel.classList.remove("open");panel.setAttribute("aria-hidden","true");overlay.classList.remove("visible");button?.setAttribute("aria-expanded","false");document.body.classList.remove("drawer-open");setTimeout(()=>{if(!panel.classList.contains("open"))overlay.hidden=true},220)}
  function closeSuggestions(){els.suggestions.hidden=true;els.suggestions.replaceChildren();els.search.setAttribute("aria-expanded","false");suggestionIndex=-1;searchMatches=[]}
  function suggestions(){
    const q=els.search.value.trim().toLocaleLowerCase();if(!q){closeSuggestions();return}
    searchMatches=data.filter(p=>[p.title,p.brand,p.shortDescription,p.sku].join(" ").toLocaleLowerCase().includes(q)).slice(0,7);
    if(!searchMatches.length){els.suggestions.replaceChildren(el("p","suggestion","No results found"));els.suggestions.hidden=false;return}
    els.suggestions.replaceChildren(...searchMatches.map((p,i)=>{const a=link("","product.html?id="+encodeURIComponent(p.id),"suggestion");a.id="suggestion-"+i;a.dataset.index=String(i);const text=el("span");text.append(el("strong","",p.title),el("small","",p.brand+" · "+p.sku));a.append(text,el("strong","",money(p.price,p.currency)));return a}));els.suggestions.hidden=false;els.search.setAttribute("aria-expanded","true")
  }
  function selectSuggestion(index){const nodes=[...els.suggestions.querySelectorAll(".suggestion[data-index]")];if(!nodes.length)return;suggestionIndex=(index+nodes.length)%nodes.length;nodes.forEach((n,i)=>n.classList.toggle("selected",i===suggestionIndex));els.search.setAttribute("aria-activedescendant",nodes[suggestionIndex].id)}
  function themeApply(dark){document.body.classList.toggle("dark-mode",dark);els.theme.setAttribute("aria-pressed",String(dark));els.theme.textContent=dark?"☀":"☾";els.drawerTheme.textContent=dark?"☀️ Light theme":"🌙 Dark theme"}
  function themeToggle(){const dark=!document.body.classList.contains("dark-mode");themeApply(dark);try{localStorage.setItem("theme",dark?"dark":"light")}catch{}}
  function initTheme(){let saved=null;try{saved=localStorage.getItem("theme")}catch{}themeApply(saved?saved==="dark":matchMedia("(prefers-color-scheme: dark)").matches);els.theme.addEventListener("click",themeToggle);els.drawerTheme.addEventListener("click",themeToggle)}

  fillForm();renderFilterOptions();renderHeading();setTimeout(renderAll,40);initTheme();if(store)store.updateHeaderCounters();
  els.form.addEventListener("change",()=>{if(innerWidth>900){readForm();renderAll()}});
  els.form.addEventListener("submit",event=>{event.preventDefault();readForm();renderAll();closeLayer(els.panel,els.filterOverlay,els.openFilters)});
  els.clear.addEventListener("click",clearFilters);els.emptyClear.addEventListener("click",clearFilters);
  els.chips.addEventListener("click",event=>{const button=event.target.closest("[data-remove-filter]");if(button)removeChip(button.dataset.removeFilter,button.dataset.value)});
  els.sort.addEventListener("change",()=>{state.sort=els.sort.value;state.page=1;renderAll()});
  els.pageSize.addEventListener("change",()=>{state.pageSize=Number(els.pageSize.value);state.page=1;renderAll()});
  els.pagination.addEventListener("click",event=>{const button=event.target.closest("[data-page]");if(!button||button.disabled)return;state.page=Number(button.dataset.page);renderAll();els.grid.scrollIntoView({behavior:"smooth",block:"start"})});
  function setView(view){state.view=view;els.gridView.setAttribute("aria-pressed",String(view==="grid"));els.listView.setAttribute("aria-pressed",String(view==="list"));renderAll()}
  els.gridView.addEventListener("click",()=>setView("grid"));els.listView.addEventListener("click",()=>setView("list"));setView(state.view);
  els.grid.addEventListener("click",event=>{const button=event.target.closest("[data-action]");if(!button)return;event.preventDefault();event.stopPropagation();const card=button.closest(".product-card"),product=data.find(p=>p.id===card?.dataset.productId);if(!product||!store)return;
    if(button.dataset.action==="cart"){store.addToCart(product.id,1);showToast(product.title+" added to cart")}
    if(button.dataset.action==="favorite"){const added=store.toggleFavorite(product.id);showToast(added?"Added to favorites":"Removed from favorites")}
    if(button.dataset.action==="compare"){const result=store.toggleCompare(product.id);showToast(result.limit?"You can compare up to 4 products":result.added?"Added to compare":"Removed from compare")}
    refreshCardState(card,product)
  });
  els.openFilters.addEventListener("click",()=>openLayer(els.panel,els.filterOverlay,els.openFilters));els.closeFilters.addEventListener("click",()=>closeLayer(els.panel,els.filterOverlay,els.openFilters));els.filterOverlay.addEventListener("click",()=>closeLayer(els.panel,els.filterOverlay,els.openFilters));
  els.openMenu.addEventListener("click",()=>{lastDrawerFocus=document.activeElement;openLayer(els.menu,els.menuOverlay,els.openMenu);els.closeMenu.focus()});els.closeMenu.addEventListener("click",()=>{closeLayer(els.menu,els.menuOverlay,els.openMenu);lastDrawerFocus?.focus()});els.menuOverlay.addEventListener("click",()=>closeLayer(els.menu,els.menuOverlay,els.openMenu));
  els.search.value=state.search;els.search.addEventListener("input",suggestions);els.searchForm.addEventListener("submit",event=>{event.preventDefault();if(suggestionIndex>=0&&searchMatches[suggestionIndex]){location.href="product.html?id="+encodeURIComponent(searchMatches[suggestionIndex].id);return}state.search=els.search.value.trim();state.page=1;closeSuggestions();renderFilterOptions();renderAll()});
  els.search.addEventListener("keydown",event=>{if(event.key==="ArrowDown"){event.preventDefault();selectSuggestion(suggestionIndex+1)}else if(event.key==="ArrowUp"){event.preventDefault();selectSuggestion(suggestionIndex-1)}else if(event.key==="Escape"){event.preventDefault();closeSuggestions()}});
  document.addEventListener("pointerdown",event=>{if(!event.target.closest(".header-search"))closeSuggestions()});
  document.addEventListener("keydown",event=>{if(event.key!=="Escape")return;if(els.menu.classList.contains("open"))closeLayer(els.menu,els.menuOverlay,els.openMenu);if(els.panel.classList.contains("open"))closeLayer(els.panel,els.filterOverlay,els.openFilters);closeSuggestions()});
  window.addEventListener("tabanji:store-updated",()=>store?.updateHeaderCounters());
  if(!data.length){els.grid.replaceChildren();els.empty.hidden=false;els.empty.querySelector("h2").textContent="Product data unavailable";els.empty.querySelector("p").textContent="Please reload the page or check data/products.js."}
});
