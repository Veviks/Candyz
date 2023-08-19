
document.addEventListener("DOMContentLoaded", () => {
    let navbar = document.querySelector(".header .navbar");
    let menuBtn = document.querySelector("#menu-btn");

    menuBtn.onclick = () => {
        menuBtn.classList.toggle("fa-times");
        navbar.classList.toggle("active");
    };

    window.onscroll = () => {
        menuBtn.classList.remove("fa-times");
        navbar.classList.remove("active");
    };
});
// var swiper = new Swiper(".home-slider", {
// 	grabCursor: true,
// 	loop: true,
// 	centeredSlides: true,
// 	navigation: {
// 		nextEl: ".swiper-button-next",
// 		prevEl: ".swiper-button-prev",
// 	},
// })

// var swiper = new Swiper(".reviews-slider", {
// 	pagination: {
// 		el: ".swiper-pagination",
// 		clickable: true,
// 	},
// 	grabCursor: true,
// 	loop: true,
// 	spaceBetween: 20,
// 	breakpoints: {
// 		0: {
// 			slidesPerView: 1,
// 		},
// 		768: {
// 			slidesPerView: 2,
// 		},
// 		991: {
// 			slidesPerView: 3,
// 		},
// 	},
// })



function checkSignUp(){
	const fullname = $("#signUpFullName").val();
	const email = $("#signUpEmail").val();
	const password = $("#passwordSignUp").val();
	let count =0;

	if (!fullname.includes(" ")){
		$("#fullnameError").css('visibility','visible');
		$("#fullnameError").text("Full-Name Must Be Two Words!");
		count++;
	}
	if (!(email.includes("@") && email.includes("."))){
		$("#wrongEmail").css('visibility','visible');
		$("#wrongEmail").text("Email Must Contains @ and . OR Email Already USED");
		count++;
	}
	if (password.length < 6){
		$("#wrongPassword").css('visibility','visible');
		$("#wrongPassword").text("Password Must Contains At Least 6 Characters!");
		count++;
	}
	if (count != 0){
		$("#PressAgain").css('visibility','visible');
		$("#PressAgain").text("Refresh The Page And Sign Up Again!");
	}
	return count
}

function showData(){
	$("#users").css('visibility','visible');
	$("#btnShow").css('visibility','hidden');
	$.get('/showData',function(data,status){
		for (let i=0; i< data.length; i++){
			if (data[i].admin === true){
				var row = "<tr>"
				+"<td style='color:blue'>" + data[i].fullname + "</td>"
				+"<td style='color:blue'>" + data[i].email + "</td>"
				+"<td style='color:blue'>" + data[i].admin + "</td>"
				+"</tr>";
				$("#userstable").append(row);
			}
			else {
					var row = "<tr>"
					+"<td>" + data[i].fullname + "</td>"
					+"<td>" + data[i].email + "</td>"
					+"<td>" + data[i].admin + "</td>"
					+"</tr>";
					$("#userstable").append(row);
				}
			}
		});
}
function showIceCreamsList(){
	event.preventDefault();
	$("#iceCreams").css('visibility','visible');
	$("#toMyCart").css('visibility','visible');
	$("#spName").css('visibility','visible');
	$("#nameinp").css('visibility','visible');
	$.get('/adminMenu/showIceCreamsList',function(data,status){
		for (let i=0; i< data.length; i++){
			var row = "<tr>"
						+"<td>" + data[i].name + "</td>"
						+"<td>" + data[i].flavor + "</td>"
						+"<td>" + data[i].quantity + "</td>"
						+"<td>" + data[i].price +"$</td>"
						+"<td><img style='width:130px'; src='" + data[i].photoURL + "'></td>"
						+"<td>" + data[i].countOrdered + "</td>" +
						"</tr>";
			$("#iceCreamsTable").append(row);
		}
		console.log(row);
	});
}
function selectedIceCreamsDisplay(){
	$("#btnSec2").css('visibility','hidden');
	$("#btnFinishOrder").css('visibility','visible');
	let arr = $.get("/selectedIceCreams",function(data,status){
		for (let i =0; i<data.length; i++){
			const str = data[i].split("_");
			const name = str[0];
			const quantity = str[1];
			$("#sec2").append("<br><div class='card'><img src='https://avirtualvegan.com/wp-content/uploads/2015/05/DSC_0209.jpg' alt='Avatar' style='width:30%';><div class='container'><h1><b>" + name +"</b></h1><p>" + quantity + " kilos" + "</p></div></div><br>");
		}
	})
}
function searchIceCreamsList1(){
	$("#iceCreams1").css('visibility','visible');
	$.get('/adminMenu/showIceCreamsList',function(data,status){
		for (let i=0; i< data.length; i++){
			var row = "<tr>"
					+"<td>" + data[i].name + "</td>"
					+"<td>" + data[i].flavor + "</td>"
					+"<td>" + data[i].quantity + "</td>"
					+"<td>" + data[i].price +"$</td>"
					+"<td><img style='width:130px'; src='" + data[i].photoURL + "';></td>"
					+"<td>" + data[i].countOrdered + "</td>" +
					"</tr>";
			$("#iceCreamsTable1").append(row);
		}
	});
}
function searchIceCreamsList2(){
	$("#iceCreams2").css('visibility','visible');
	$("#text1").css('visibility','visible');
	$.get('/adminMenu/showIceCreamsList',function(data,status){
		let count = 0;
		let index = 0;
		str = window.location.search;
		if (typeof str === 'string'){
			var firstSplit = str.toString().split("?");
			var params = firstSplit.toString().split("&");
			for (let i=0; i<params.length; i++){
				var arr = params[i].toString().split("=");
				var result = arr[1];
				if (result != "")
					index = i;
			}
			 if (index === 0){
				var arr = params[0].toString().split("=");
				var value = arr[1];
				if (value === "All"){
					$("#SearchParam").text("All Ice Creams");
					for (let i=0; i<data.length; i++){
						var row = "<tr>"
						+"<td>" + data[i].name + "</td>"
						+"<td>" + data[i].flavor + "</td>"
						+"<td>" + data[i].quantity + "</td>"
						+"<td>" + data[i].price +"$</td>"
						+"<td><img style='width:130px'; src='" + data[i].photoURL + "';></td>"
						+"<td>" + data[i].countOrdered + "</td>" +
						"</tr>";
						$("#iceCreamsTable2").append(row);
					}
				}
				if (value === "Most+Purchased+"){
					$("#SearchParam").text("Sort By Most Purchased");
					$.get('/adminMenu/showMostWantedIceCream',function(data,status){
						for (let i=0; i<data.length; i++){
							var row = "<tr>"
							+"<td>" + data[i].name + "</td>"
							+"<td>" + data[i].flavor + "</td>"
							+"<td>" + data[i].quantity + "</td>"
							+"<td>" + data[i].price +"$</td>"
							+"<td><img style='width:130px'; src='" + data[i].photoURL + "';></td>"
							+"<td>" + data[i].countOrdered + "</td>" +
							"</tr>";
							$("#iceCreamsTable2").append(row);
						}
					});
				}
				if (value === "Max+Price"){
					$("#SearchParam").text("Sort By Max Price");
					$.get('/adminMenu/showMaxPriceIceCream',function(data,status){
						for (let i=0; i<data.length; i++){
							var row = "<tr>"
							+"<td>" + data[i].name + "</td>"
							+"<td>" + data[i].flavor + "</td>"
							+"<td>" + data[i].quantity + "</td>"
							+"<td>" + data[i].price +"$</td>"
							+"<td><img style='width:130px'; src='" + data[i].photoURL + "';></td>"
							+"<td>" + data[i].countOrdered + "</td>" +
							"</tr>";
							$("#iceCreamsTable2").append(row);
						}
					});
				}
				if (value === "Min+Price"){
					$("#SearchParam").text("Sort By Min Price");
					$.get('/adminMenu/showMinPriceIceCream',function(data,status){
						for (let i=0; i<data.length; i++){
							var row = "<tr>"
							+"<td>" + data[i].name + "</td>"
							+"<td>" + data[i].flavor + "</td>"
							+"<td>" + data[i].quantity + "</td>"
							+"<td>" + data[i].price +"$</td>"
							+"<td><img style='width:130px'; src='" + data[i].photoURL + "';></td>"
							+"<td>" + data[i].countOrdered + "</td>" +
							"</tr>";
							$("#iceCreamsTable2").append(row);
						}
					});
				}	
			 }
			 else{
				var arr = params[index].toString().split("=");
				var param = arr[0];
				var result = arr[1];
				$("#SearchParam").text("Results for Specific " + param);
				for (let i=0; i< data.length; i++){
					if (param === "name"){
						if (data[i].name === result){
							var row = "<tr>"
							+"<td>" + data[i].name + "</td>"
							+"<td>" + data[i].flavor + "</td>"
							+"<td>" + data[i].quantity + "</td>"
							+"<td>" + data[i].price +"$</td>" 
							+"<td><img style='width:130px'; src='" + data[i].photoURL + "';></td>"
							+"<td>" + data[i].countOrdered + "</td>" +
							"</tr>";
							$("#iceCreamsTable2").append(row);
						}
						count++;
					}
					else if (param === "flavor"){
						if (data[i].flavor === result){
							var row = "<tr>"
							+"<td>" + data[i].name + "</td>"
							+"<td>" + data[i].flavor + "</td>"
							+"<td>" + data[i].quantity + "</td>"
							+"<td>" + data[i].price +"$</td>" 
							+"<td><img style='width:130px'; src='" + data[i].photoURL + "';></td>"
							+"<td>" + data[i].countOrdered + "</td>" +
							"</tr>";
							$("#iceCreamsTable2").append(row);
						}
						count++;
					}
					else if (param === "quantity"){
						if (data[i].quantity == result){
							var row = "<tr>"
							+"<td>" + data[i].name + "</td>"
							+"<td>" + data[i].flavor + "</td>"
							+"<td>" + data[i].quantity + "</td>"
							+"<td>" + data[i].price +"$</td>" 
							+"<td><img style='width:130px'; src='" + data[i].photoURL + "';></td>"
							+"<td>" + data[i].countOrdered + "</td>" +
							"</tr>";
							$("#iceCreamsTable2").append(row);
						}
						count++;
					}
					else if (param === "price"){
						if (data[i].price == result){
							var row = "<tr>"
							+"<td>" + data[i].name + "</td>"
							+"<td>" + data[i].flavor + "</td>"
							+"<td>" + data[i].quantity + "</td>"
							+"<td>" + data[i].price +"$</td>" 
							+"<td><img style='width:130px'; src='" + data[i].photoURL + "';></td>"
							+"<td>" + data[i].countOrdered + "</td>" +
							"</tr>";
							$("#iceCreamsTable2").append(row);
						}
						count++;
					}
				}

				if (count === 0){
					var row = "<tr><td>Couldn't find anything</td></tr>"
					$("#iceCreamsTable2").append(row);
				}
			}
		
		}
	});
}

function f(){
	var data = JSON.parse(localStorage.getItem("result"));
	console.log("data = " + data);
	$("#doc").text(data);
}
function redirectToIceCreamsMenu(){
	window.location.replace("/adminMenu/iceCreams");
}
