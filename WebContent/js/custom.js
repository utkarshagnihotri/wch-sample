/** 
  
  Custom JS
  

  1. CARTBOX
  2. TOOLTIP
  3. PRODUCT VIEW SLIDER 
  4. POPULAR PRODUCT SLIDER (SLICK SLIDER) 
  5. FEATURED PRODUCT SLIDER (SLICK SLIDER)
  6. LATEST PRODUCT SLIDER (SLICK SLIDER) 
  7. TESTIMONIAL SLIDER (SLICK SLIDER)
  8. CLIENT BRAND SLIDER (SLICK SLIDER)
  9. PRICE SLIDER  (noUiSlider SLIDER)
  10. SCROLL TOP BUTTON
  11. PRELOADER
  12. GRID AND LIST LAYOUT CHANGER 
  13. RELATED ITEM SLIDER (SLICK SLIDER)
  14. TOP SLIDER (SLICK SLIDER)

  
**/

var STATUS = {
		FAILED:'failed',
		LOADING:'loading',
		DONE:'done'
}

var TAXONOMY = {
	DEMO:{
		NAME : 'Demo'
	},
	HOME:{
		NAME : 'Home',
		PATH : 'Demo/Home'	 
	},
	MEN:{
		NAME : 'Men',
		PATH : 'Demo/Home/Men'	 
	},
	WOMEN:{
		NAME : 'Women',
		PATH : 'Demo/Home/Women'	 
	},
	SPORTS:{
		NAME : 'Sports',
		PATH : 'Demo/Home/Sports'	 
	},
	ELECTRONICS:{
		NAME : 'Electronics',
		PATH : 'Demo/Home/Electronics'	 
	},
	PROMOTIONS:{
		NAME : 'Promotions',
		PATH : 'Demo/Home/Promotions'	 
	},
	PAGES:{
		NAME : 'Pages',
		PATH : 'Demo/Pages'	 
	},
	CONTACT:{
		NAME : 'Contact',
		PATH : 'Demo/Contact'	 
	},
	SUPPORT:{
		NAME : 'Support',
		PATH : 'Demo/Contact/Support'	 
	},
	FEEDBACK:{
		NAME : 'Feedback',
		PATH : 'Demo/Contact/Feedback'	 
	}
	,
	BLOG:{
		NAME : 'Blog',
		PATH : 'Demo/Blog'	 
	}
}
var CONTENT_TYPE ={
		ARTICLE : "Article",
		PRODUCTS : "home-page-products",
		PROMOTIONS :"home-page-promotion",
		FASHION:"fashion-banner",
		SUPPORT:"TextAndBody",
		BLOG:"demo-blog"
} 

var Utils = function(){
		
		function showLoading(selector){
			 $(selector).show();
		}
		
		function hideLoading(selector){
			 $(selector).delay(200).fadeOut('slow');
		}
		
		return {
			showLoading,
			hideLoading
		};
};

jQuery(function($){


  /* ----------------------------------------------------------- */
  /*  1. CARTBOX 
  /* ----------------------------------------------------------- */
    
     jQuery(".aa-cartbox").hover(function(){
      jQuery(this).find(".aa-cartbox-summary").fadeIn(500);
    }
      ,function(){
          jQuery(this).find(".aa-cartbox-summary").fadeOut(500);
      }
     );   
  
  /* ----------------------------------------------------------- */
  /*  2. TOOLTIP
  /* ----------------------------------------------------------- */    
    jQuery('[data-toggle="tooltip"]').tooltip();
    jQuery('[data-toggle2="tooltip"]').tooltip();

  /* ----------------------------------------------------------- */
  /*  3. PRODUCT VIEW SLIDER 
  /* ----------------------------------------------------------- */    

    jQuery('#demo-1 .simpleLens-thumbnails-container img').simpleGallery({
        loading_image: 'demo/images/loading.gif'
    });

    jQuery('#demo-1 .simpleLens-big-image').simpleLens({
        loading_image: 'demo/images/loading.gif'
    });



  /* ----------------------------------------------------------- */
  /*  9. PRICE SLIDER  (noUiSlider SLIDER)
  /* ----------------------------------------------------------- */        

    jQuery(function(){
      if($('body').is('.productPage')){
       var skipSlider = document.getElementById('skipstep');
        noUiSlider.create(skipSlider, {
            range: {
                'min': 0,
                '10%': 10,
                '20%': 20,
                '30%': 30,
                '40%': 40,
                '50%': 50,
                '60%': 60,
                '70%': 70,
                '80%': 80,
                '90%': 90,
                'max': 100
            },
            snap: true,
            connect: true,
            start: [20, 70]
        });
        // for value print
        var skipValues = [
          document.getElementById('skip-value-lower'),
          document.getElementById('skip-value-upper')
        ];

        skipSlider.noUiSlider.on('update', function( values, handle ) {
          skipValues[handle].innerHTML = values[handle];
        });
      }
    });


    
  /* ----------------------------------------------------------- */
  /*  10. SCROLL TOP BUTTON
  /* ----------------------------------------------------------- */

  //Check to see if the window is top if not then display button

    jQuery(window).scroll(function(){
      if ($(this).scrollTop() > 300) {
        $('.scrollToTop').fadeIn();
      } else {
        $('.scrollToTop').fadeOut();
      }
    });
     
    //Click event to scroll to top

    jQuery('.scrollToTop').click(function(){
      $('html, body').animate({scrollTop : 0},800);
      return false;
    }); 

  /* ----------------------------------------------------------- */
  /*  12. GRID AND LIST LAYOUT CHANGER 
  /* ----------------------------------------------------------- */

  jQuery("#list-catg").click(function(e){
    e.preventDefault(e);
    jQuery(".aa-product-catg").addClass("list");
  });
  jQuery("#grid-catg").click(function(e){
    e.preventDefault(e);
    jQuery(".aa-product-catg").removeClass("list");
  });

    
});

