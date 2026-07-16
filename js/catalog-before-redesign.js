/* ================= SIDE MENU ================= */


function openMenu(){

document.getElementById("sideMenu").classList.add("active");

document.getElementById("overlay").classList.add("active");

}



function closeMenu(){

document.getElementById("sideMenu").classList.remove("active");

document.getElementById("overlay").classList.remove("active");

}




/* ================= DARK MODE ================= */


function toggleTheme(){

document.body.classList.toggle("dark-mode");


localStorage.setItem(

"theme",

document.body.classList.contains("dark-mode")

? "dark"

: "light"

);

}



if(localStorage.getItem("theme") === "dark"){

document.body.classList.add("dark-mode");

}





/* ================= CATEGORY DATABASE ================= */


/* ================= SHOW CATEGORY ================= */


function showCategory(name){


let data = categories[name];


if(!data) return;



document.getElementById("megaTitle").innerHTML=data.title;



let content="";



data.groups.forEach(group=>{


content += `

<div class="mega-column">


<h3>${group[0]}</h3>


<div class="mega-group">

${

group[1].map(item=>`

<a href="#">
${item}
</a>

`).join("")

}

</div>


</div>

`;


});



document.getElementById("megaContent").innerHTML=content;


}




/* PC HOVER */


function desktopCategory(name){


if(window.innerWidth > 900){

showCategory(name);

}


}




/* PHONE CLICK */


function mobileCategory(name){


if(window.innerWidth <= 900){

showCategory(name);

}


}

/* CLOSE MENU AFTER CLICK */


document.querySelectorAll(".side-menu a").forEach(link=>{


link.addEventListener("click",()=>{


closeMenu();


});


});




/* DEFAULT CATEGORY */


document.addEventListener("DOMContentLoaded", () => {


showCategory("computers");


});

