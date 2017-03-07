//Constants are defined in custom.js

//create the root app module
const module = angular.module('SampleWchApp', ['ui.router','angular-inview']);


module.config(['$httpProvider','$stateProvider', '$urlRouterProvider', function ($httpProvider, $stateProvider, $urlRouterProvider) {
	$httpProvider.defaults.withCredentials = true;

}]);

/*
 * Angular factory/Service which accesses WCH
 * 
 */
module.factory('wchService', ['$http', function ($http) {

	// Content Hub blueid username and password - replace these or add code to get these from inputs
	let username="";
	let password="";
	
	// use this to get tenant from the basicauth call, filled in during login() below
	let baseTenantUrl = '';

	/**
	 * Logs into Watson Content hub
	 * 
	 * @return {Promise}
	 */
	function login() {

		if(!username || !password)
			return this;

		return $http({
			method: 'GET',
			url: 'https://my.digitalexperience.ibm.com/api/login/v1/basicauth',
			headers: { 'Authorization': 'Basic ' + btoa(username + ':' + password) }
		}).then(response => {
			baseTenantUrl = response.headers('x-ibm-dx-tenant-base-url');
			return response.data;
		});
	}
	
	/**
	 * Logs into Watson Content hub 
	 * 
	 * @return {Promise}
	 */
	function loginWithCredentials(user, pass) {
		username = user;
		password = pass;
		return login();
	}

	
	/**
	 * Get the base url which includes the tenant id
	 * 
	 * @return {String}
	 */
	function getBaseURL() {
		return baseTenantUrl;
	}

	/**
	 * Retrieves the ID for the taxonomy with a given name
	 * 
	 * @param {String}
	 *            taxonomyName: The string name of the taxonomy to fetch
	 * @return {Promise} resolves to a taxonomy Object
	 */
	function getTaxonomyByName(taxonomyName) {
		return $http({
			method: 'GET',
			url: baseTenantUrl + '/authoring/v1/categories',
			withCredentials: true
		}).then(response => {
			return response.data.items.find(item => {
				return item.name === taxonomyName;
			});
		});
	}

	/**
	 * Retrieves the categories under a given taxonomy id
	 * 
	 * @return {String} id: The string id of the taxonomy
	 * @return {Promise} resolves to an Array of category Objects
	 */
	function getCategoriesByTaxonomyID(id, recurse) {

		recurse = recurse == 'true' ? recurse : 'false';
		return $http({
			method: 'GET',
			url: baseTenantUrl + '/authoring/v1/categories/' + id + '/children?recurse='+recurse,
			withCredentials: true
		}).then(response => {
			return response.data.items;
		});
	}

	/**
	 * Search the content based on content type and category ( Taxonomy name)
	 * 
	 * @param {String}
	 *            category: The string name of the taxonomy to fetch
	 * @return {Promise} resolves to an array of content item Objects
	 */
	function getContentItemsByContentTypeCategoryName(contentType,categoryName) {
		return $http({
			method: 'GET',
			url: baseTenantUrl + '/authoring/v1/search?q=*:*&wt=json&fq=type%3A%22'+ contentType + '%22&fq=classification:(content)&fl=id,document&fq=categories:(' + categoryName + ')&sort=lastModified%20desc',
			withCredentials: true
		}).then(response => {
			return response.data.documents;
		});
	}



	return {
		loginWithCredentials,
		getBaseURL,
		getTaxonomyByName,
		getCategoriesByTaxonomyID,
		getContentItemsByContentTypeCategoryName
	};
}]);



/**
 * An angular component for a bootstrap tabbed navigation based on the Demo taxonomy data
 * 
 */ 
module.component('taxonomyNavigation', {
	controller: ['$rootScope', '$state', 'wchService','$scope', function ($rootScope, $state, wchService, $scope) {

		// initialize data
		$scope.tabs = [];
		$scope.status = STATUS.FAILED;	// set the status, one of 'loading', 'failed', 'done'
		let taxonomyName = TAXONOMY.DEMO.NAME;
		/*
		 * Init function which loads the taxonomy to display as the Menu
		 */
		$scope.init = function(){
			
			if($scope.status == STATUS.FAILED){
				
				$scope.status = STATUS.LOADING;
				// retrieve the Demo taxonomy for this tenant
				wchService.getTaxonomyByName(taxonomyName).then(taxonomy => {
	
					// retrieve the categories under the given taxonomy to populate the navigation
					return wchService.getCategoriesByTaxonomyID(taxonomy.id,'false');
					
				}).then(categories => {
	
					$scope.tabs = categories;
					$scope.status = STATUS.DONE;
	
				// print out any errors
				}).catch(error => {
					$scope.status = STATUS.FAILED;
					console.error('Error logging in and loading the navigation: %o', error);
	
				});
			}
		}

	}], templateUrl:"templates/menu.html"
});



// An angular component to show the carousel
module.component('carouselDetails', {
	controller: ['$rootScope','$state', 'wchService','$scope', function ($rootScope, $state, wchService, $scope) {

		$scope.slides = [];
		$scope.status = STATUS.FAILED;	
		let loader = "#aa-slider .wpf-loader-two";

		$scope.init = function (){
			if($scope.status  ==  STATUS.FAILED){
				
				$scope.status = STATUS.LOADING;
				
				wchService.getContentItemsByContentTypeCategoryName(CONTENT_TYPE.ARTICLE, TAXONOMY.HOME.PATH).then(items => {	
					
					let baseTenantUrl = wchService.getBaseURL(); //Tentant url to map the images from WCH
					let contentItems = [];
					
					//build the json as per the UI model
					angular.forEach(items, function(itemDoc){
						
						let item = $.parseJSON(itemDoc.document).elements;
						// normalize the values
						item.id = itemDoc.id;
						item.title = item.title ? item.title.value : 'untitled';
						item.summary = item.summary ? item.summary.value : '';
						item.author = item.author ? item.author.value : '';
						item.body = item.body ? item.body.value : '';
						item.imgSrc = item.image.asset ? baseTenantUrl + item.image.asset.resourceUri : '';
						item.thumbnail = item.image.renditions && item.image.renditions.thumbnail ? baseTenantUrl + item.image.renditions.thumbnail.source : '';
						let publishDate = item.publishDate ? new Date(item.publishDate.value) : new Date('');
						item.publishDate = publishDate.toLocaleDateString();
						// add the content item to the array
						contentItems.push(item);

					})

					$scope.slides = contentItems;
					$scope.status = STATUS.DONE;
					
					// print out any errors
					setTimeout(function(){
						$('.seq-canvas').slick({
							dots: false,
							infinite: true,
							speed: 500,
							fade: true,
							cssEase: 'linear'
						});
					}, 1000);
					Utils().hideLoading(loader); 
				}).catch(error => { 
					$scope.status = STATUS.FAILED;
					console.error('Error loading the content items in the category: ');
				});
			}
		}
	}], templateUrl:"templates/carousel.html"
});


// An angular component to show the promotions section <promotion-details></promotion-details>
module.component('promotionDetails', {
	controller: ['$state', 'wchService','$scope', function ($state, wchService, $scope) {

		$scope.promotionsRight = [];
		$scope.promotionsLeft = [];
		$scope.status = STATUS.FAILED;	
		
		let loader = '#aa-promo .wpf-loader-two';
			
		$scope.init = function(){
			if($scope.status == STATUS.FAILED){
				$scope.status = STATUS.LOADING;	
				wchService.getContentItemsByContentTypeCategoryName(CONTENT_TYPE.PROMOTIONS, TAXONOMY.PROMOTIONS.PATH).then(items => {	
					
					let baseTenantUrl = wchService.getBaseURL();
					let contentItems = [];

					angular.forEach(items, function(itemDoc) {
						// the entire content item is available in the
						// "document"
						// field as a JSON string, so we'll parse it
						let item = $.parseJSON(itemDoc.document).elements;
						// normalize the values
						item.id = itemDoc.id;
						item.title = item.title ? item.title.value : 'untitled';
						item.description = item.description ? item.description.value : '';
						item.author = item.author ? item.author.value : '';
						item.body = item.body ? item.body.value : '';
						item.imgSrc = item.image.asset ? baseTenantUrl + item.image.asset.resourceUri : '';
						item.thumbnail = item.image.renditions && item.image.renditions.thumbnail ? baseTenantUrl + item.image.renditions.thumbnail.source : '';
						// add the content item to the array
						contentItems.push(item);
					});

					$scope.promotionsLeft.push(contentItems.pop());
					$scope.promotionsRight = contentItems;
					$scope.status = STATUS.DONE;	
					Utils().hideLoading(loader); 
				}).catch(error => { 
					//Utils().hideLoading(loader); 
					this.status = STATUS.FAILED;	
					console.error('Error loading the content items in the %o category: %o', this.categoryName, error);
				});
				
			}
		}
	}], templateUrl:"templates/promotions.html"
});


/*
 * Controller and Component to load the product section on the page
 * 
 */	
module.component('productSection', {
	controller: ['$state', 'wchService','$scope', function ($state, wchService, $scope) {

		$scope.products = [];
		$scope.activeTab = "Men";
		$scope.status = STATUS.FAILED;	
		let loader = '#aa-product .wpf-loader-two';
		let INIT_STR = 'init';
		$scope.product = {};
		/*
		 * 
		 * Function to get the products
		 * 
		 */
		$scope.init = function (active){

			if($scope.status == STATUS.FAILED	 || active != INIT_STR){
				
				Utils().showLoading(loader);
				
				$scope.status = STATUS.LOADING;	
				active = active == INIT_STR ? $scope.activeTab: active;
				
					wchService.getContentItemsByContentTypeCategoryName(CONTENT_TYPE.PRODUCTS, TAXONOMY.HOME.PATH+"/"+active).then(items => {		
						let baseTenantUrl = wchService.getBaseURL();
						let contentItems = [];

						angular.forEach(items, function(itemDoc) {
							// the entire content item is available in the
							// "document" field as a JSON string, so we'll parse
							// it
							let item = $.parseJSON(itemDoc.document).elements;
							// normalize the values
							item.id = itemDoc.id;
							item.title = item.title ? item.title.value : 'untitled';
							item.description = item.descripton ? item.descripton.value : '';
							item.imgSrc = item.product_image_1.asset? baseTenantUrl + item.product_image_1.asset.resourceUri : '';
							item.thumbnail = item.product_image_1.renditions && item.product_image_1.renditions.thumbnail_250_300 ? baseTenantUrl + item.product_image_1.renditions.thumbnail_250_300.source : '';
							item.price = item.price? item.price.value : '0';
							item.availability = item.availability? item.availability.value : '0';
							
							item.sizes = item.size? item.size.value : '';
							
							if(item.sizes.indexOf(",") > 0){
								item.sizes = item.sizes.split(",");
							}
							console.log(item.sizes);
							// add the content item to the array
							contentItems.push(item);
						});

						$scope.products = contentItems;
						$scope.status = STATUS.DONE;
						Utils().hideLoading(loader); 
						
					}).catch(error => { 
						$scope.status = STATUS.FAILED;
						Utils().hideLoading(loader); 
						console.error('Error loading the content items in the %o category: %o', this.categoryName, error);
					});
			}
		}
		
		/***
		 * function for product details
		 */

		$scope.showProduct = function(id){
			console.log(id);
			angular.forEach($scope.products, function(value){
				if(value.id == id){
					$scope.product = value;
				}
			});
			
			$('#quick-view-modal').modal();
			
		}
	}], templateUrl:"templates/products.html"
});


/**
 * 
 * Popular/Latest/Featured section controller
 * 
 */
module.component('popularSection', {
	controller: ['$state', 'wchService','$scope', function ($state, wchService, $scope) {

		$scope.status = STATUS.FAILED;
		$scope.bannerStatus = STATUS.FAILED;;
		$scope.products = [];
		$scope.activeTab = "Popular";
		let loader = '#aa-popular-category .wpf-loader-two';
		let banloader = '#aa-banner .wpf-loader-two';
		let INIT_STR = 'init';
		/*
		 * function to get the products with tag, "Popular"
		 * 
		 */
		$scope.init = function (active){
		
			if($scope.status == STATUS.FAILED || active != INIT_STR){
				Utils().showLoading(loader);
				$scope.status  = STATUS.LOADING;
				active = active == INIT_STR ? $scope.activeTab: active;
				wchService.getContentItemsByContentTypeCategoryName(CONTENT_TYPE.PRODUCTS, TAXONOMY.PAGES.PATH+"/"+active).then(items => {		
					let baseTenantUrl = wchService.getBaseURL();
					let contentItems = [];

					angular.forEach(items, function(itemDoc) {
						// the entire content item is available in the
						// "document" field as a JSON string, so we'll parse it
						let item = $.parseJSON(itemDoc.document).elements;
						// normalize the values
						item.id = itemDoc.id;
						item.title = item.title ? item.title.value : 'untitled';
						item.description = item.descripton ? item.descripton.value : '';
						item.imgSrc = item.product_image_1.asset? baseTenantUrl + item.product_image_1.asset.resourceUri : '';
						item.thumbnail = item.product_image_1.renditions && item.product_image_1.renditions.thumbnail_250_300 ? baseTenantUrl + item.product_image_1.renditions.thumbnail_250_300.source : '';
						item.price = item.price? item.price.value : '0';
						// add the content item to the array
						contentItems.push(item);
					});

					try{
						$('.aa-popular-slider').slick('unslick');
					}catch(err){
						console.log(err);
					}
					$scope.products = contentItems;
					$scope.status = STATUS.DONE;

					
					// jQuery slider
					setTimeout(function(){
					
					$('.aa-popular-slider').slick({
						dots: false,
						infinite: false,
						speed: 300,
						slidesToShow: 4,
						slidesToScroll: 4,
						responsive: [
						             {
						            	 breakpoint: 1024,
						            	 settings: {
						            		 slidesToShow: 3,
						            		 slidesToScroll: 3,
						            		 infinite: true,
						            		 dots: true
						            	 }
						             },
						             {
						            	 breakpoint: 600,
						            	 settings: {
						            		 slidesToShow: 2,
						            		 slidesToScroll: 2
						            	 }
						             },
						             {
						            	 breakpoint: 480,
						            	 settings: {
						            		 slidesToShow: 1,
						            		 slidesToScroll: 1
						            	 }
						             }
						             ]
					});
					}, 1000);
					Utils().hideLoading(loader);
				}).catch(error => { 
					$scope.status = STATUS.FAILED;
					Utils().hideLoading(loader);
					console.error('Error loading the content items in the %o category: %o', this.categoryName, error);
				});
			}
			
		}

		

		/*
		 * function to get the banner details
		 */
		$scope.banner = function(){
			
			if($scope.bannerStatus == STATUS.FAILED){
				
				$scope.bannerStatus = STATUS.LOADING;
				wchService.getContentItemsByContentTypeCategoryName(CONTENT_TYPE.FASHION, TAXONOMY.HOME.PATH).then(items => {		

					let baseTenantUrl = wchService.getBaseURL();
					let contentItems = [];

					angular.forEach(items, function(itemDoc) {
						// the entire content item is available in the
						// "document" field as a JSON string, so we'll parse it
						let item = $.parseJSON(itemDoc.document).elements;
						// normalize the values
						item.id = itemDoc.id;
						item.imgSrc = item.image.asset? baseTenantUrl + item.image.asset.resourceUri : '';
						item.thumbnail = item.image.renditions && item.image.renditions.thumbnail ? baseTenantUrl + item.image.renditions.thumbnail.source : '';

						// add the content item to the array
						contentItems.push(item);
					});

					$scope.fashionBanner = contentItems[0];
					$scope.bannerStatus = STATUS.DONE;
					Utils().hideLoading(banloader);

				}).catch(error => { 
					Utils().hideLoading(banloader);
					$scope.bannerStatus = STATUS.FAILED;
					console.error('Error loading the content items in the %o category: %o', this.categoryName, error);
				});
			}
		}
		
	}], templateUrl:"templates/popular.html"
});

/*
 * Support/Feedback Section Controller
 * 
 */
module.component('supportSection', {
	controller: ['$state', 'wchService','$scope', function ($state, wchService, $scope) {

		$scope.supports = [];
		$scope.slides = [];
		
		let loader = '#aa-support .wpf-loader-two';
		let testLoader = '#aa-testimonial .wpf-loader-two';
		$scope.status = STATUS.FAILED;
		$scope.statusFeed = STATUS.FAILED;

		/**
		 * Initial function which renders the UI with content
		 */
		$scope.init = function (){
			
			if($scope.status == STATUS.FAILED){
				$scope.status = STATUS.LOADING;
				wchService.getContentItemsByContentTypeCategoryName(CONTENT_TYPE.SUPPORT,TAXONOMY.SUPPORT.PATH).then(items => {		
					let baseTenantUrl = wchService.getBaseURL();
					let contentItems = [];

					angular.forEach(items, function(itemDoc) {
						// the entire content item is available in the
						// "document" field as a JSON string, so we'll parse it
						let item = $.parseJSON(itemDoc.document).elements;
						// normalize the values
						item.id = itemDoc.id;
						item.title = item.title ? item.title.value : 'untitled';
						item.body = item.body ? item.body.value : '';
						item["class"] = item["class"]? item["class"].value  : '';

						// add the content item to the array
						contentItems.push(item);
					});

					$scope.supports = contentItems;
					$scope.status = STATUS.DONE;
					Utils().hideLoading(loader);

				}).catch(error => { 
					Utils().hideLoading(loader);
					$scope.status = STATUS.FAILED;
					console.error('Error loading the content items in the %o category: %o', this.categoryName, error);
				});

			}
		}
		
		$scope.feedback = function (){
			
				if($scope.statusFeed == STATUS.FAILED){
					
					$scope.statusFeed == STATUS.LOADING;
					wchService.getContentItemsByContentTypeCategoryName(CONTENT_TYPE.ARTICLE,TAXONOMY.FEEDBACK.PATH).then(items => {		
						let baseTenantUrl = wchService.getBaseURL();
						let contentItems = [];
	
						angular.forEach(items, function(itemDoc) {
						
							let item = $.parseJSON(itemDoc.document).elements;
							// normalize the values
							item.id = itemDoc.id;
							item.designation = item.title ? item.title.value : 'untitled';
							item.feedback = item.body ? item.body.value : '';
							item.name = item.author ? item.author.value : '';
							item.imgSrc = item.image.asset? baseTenantUrl + item.image.asset.resourceUri : '';
							item.company = item.summary? item.summary.value : '0';
							contentItems.push(item);
						});
						
						try{
	
							$('.aa-testimonial-slider').slick('unslick');
						
						}catch(err){
							console.log(err);
						}
						
						$scope.slides = contentItems;
						$scope.statusFeed = STATUS.DONE;
	
						//jquery slider
						setTimeout(function(){
						
							$('.aa-testimonial-slider').slick({
	
								dots: true,
								infinite: true,
								arrows: false,
								speed: 300,
								slidesToShow: 1,
								adaptiveHeight: true
							})
						}, 1000);
						Utils().hideLoading(testLoader);
				}).catch(error => { 
					$scope.statusFeed = STATUS.FAILED;
					Utils().hideLoading(testLoader);
					console.error('Error loading the content items in the category: %o', error);
				});
			}
		}

	}], templateUrl:"templates/support.html"
});


/**
 * The controller for the blog section
 */

module.component('blogSection', {
	controller: ['$state', 'wchService','$scope', function ($state, wchService, $scope) {

		$scope.blogs = [];
		$scope.status = STATUS.FAILED;
		let loader = "#aa-latest-blog .wpf-loader-two";

		$scope.init = function (){
			
			if($scope.status == STATUS.FAILED){
				
				$scope.status == STATUS.LOADING;
				
				wchService.getContentItemsByContentTypeCategoryName(CONTENT_TYPE.BLOG,TAXONOMY.BLOG.PATH).then(items => {		
					let baseTenantUrl = wchService.getBaseURL();
					let contentItems = [];

					angular.forEach(items, function(itemDoc) {
					
						let item = $.parseJSON(itemDoc.document).elements;
						// normalize the values
						item.id = itemDoc.id;
						item.likes = item.likes ? item.likes.value : 'untitled';
						item.thumbsup = item.thumbsup ? item.thumbsup.value : '';
						item.comments = item.comments ? item.comments.value : '';
						item.imgSrc = item.image.asset? baseTenantUrl + item.image.asset.resourceUri : '';
						item.thumbnail = item.image.renditions && item.image.renditions.thumbnail ? baseTenantUrl + item.image.renditions.thumbnail.source : '';
						item.publishedDate = item.publishedDate? item.publishedDate.value : '';
						item.title = item.title? item.title.value : 'untitled';
						item.summary = item.summary? item.summary.value : '';
						contentItems.push(item);
					});
					
					
					$scope.blogs = contentItems;
					$scope.status = STATUS.DONE;
					
					Utils().hideLoading(loader);
					
			}).catch(error => { 
				$scope.status = STATUS.FAILED;
				Utils().hideLoading(loader);
				console.error('Error loading the content items in the category: %o', error);
			});
		}
	}

	}], templateUrl:"templates/blog.html"
});


/**
*Login Controller - Responsible for the new Login to WCH via UI inputs
*
* 
*/
module.component('loginSection', {
	controller: ['$state', 'wchService','$scope', function ($state, wchService, $scope) {

		$scope.username = "utkarsh.agnihotri@siriuscom.com";
		$scope.password = "";
		
		// Gets Invoked on click of Login Button
		$scope.login = function(){
			
			$('#login-modal').modal('hide');
			wchService.loginWithCredentials($scope.username, $scope.password).then(() => {
				
				$('#wpf-loader-two').delay(200).fadeOut('slow'); 
			});
		}
		  
		 $('#login-modal').modal();
	    
	}], templateUrl:"templates/login.html"
});
