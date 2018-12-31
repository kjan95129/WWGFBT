import React, { Component } from 'react'
import './App.css'
import ReactGA from 'react-ga'

// User Imports
import { YELP_API_URL } from '../profiles/dev'
import BobaSVG from '../components/bobaSVG'

ReactGA.initialize('UA-73963331-3')
ReactGA.pageview(window.location.pathname + window.location.search)


class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            location: '',
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.placeholder = 'Enter City or Zip';
        this.category = 'bubbletea';
        this.maxHistory = 5;
    }

    // Mounts event listener after first render
    componentDidMount() {
        document.addEventListener('keydown', this.onKeyPressed.bind(this))
    }

    // Listens to enter keystroke to display new shop
    onKeyPressed(e) {
        if (e.key === 'Enter' && document.getElementById('seeAllModal').style.display === "none") {
            this.handleSubmit(e)
        }
        else if (e.key === "Esc" || e.key === "Escape") {
            this.setModal(false);
        }
    }


    // Handles any change & keystroke on input field
    handleChange(event) {
        this.setState({ location: event.target.value });
    }

    // Handles form submission
    handleSubmit(event) {
        this.hideHTML('locationInput')
        this.getShopList()
        this.restartBoba()
        this.moveBoba()
        event.preventDefault()
    }

    // Helper function to hide HTML
    hideHTML(tagID) {
        document.getElementById(tagID).style.display = 'none'
    }

    // Helper function to show HTML
    showHTML(tagID) {
        if (tagID === 'weOutDiv' || tagID === 'locationRef' || tagID === 'history-title') {
            document.getElementById(tagID).style.display = 'block'
        } else {
            document.getElementById(tagID).style.display = 'initial'
        }
    }

    showWeOut() {
        this.showHTML('weOutDiv')
        this.hideHTML('loader')
        this.showHTML('yelpRating')
        this.showHTML('shopNameContainer')
        this.showHTML('reviewCount')
        this.showHTML('tryAgain')
        this.showHTML('seeAllNearby')
        this.showHTML('history-title')
        this.showHTML('historyContainer')
        this.showHTML('goButton')
    }

    showLoader() {
        this.showHTML('weOutDiv')
        this.showHTML('loader')
        this.hideHTML('shopNameContainer')
        this.hideHTML('yelpRating')
        this.hideHTML('reviewCount')
        this.hideHTML('goButton')
        this.hideHTML('history-title')
        this.hideHTML('historyContainer')
        this.hideHTML('goButton')
        this.hideHTML('errorText')
    }

    // Adds boba movement class
    moveBoba(){
        document.getElementById('strawboba').classList.add('move-boba')
    }

    // Adds boba movement class
    restartBoba(){
        document.getElementById('strawboba').style.webkitAnimation = 'none';
        setTimeout(function() {
            document.getElementById('strawboba').style.webkitAnimation = '';
        }, 1);
        document.getElementById('strawboba').classList.remove('move-boba')
    }

    async getShopList() {
        let response, shops

        // Checking localstorage for existence of location array
        if (window.localStorage.getItem(this.state.location)) {
            shops = JSON.parse(window.localStorage.getItem(this.state.location))
        }
        else {
            this.showLoader()
            // Google Analytics handlers to push location info
            ReactGA.event({
                category: 'Location',
                action: this.state.location,
            })
            // Calls API, converts to json synchronously 
            response = await fetch(`${YELP_API_URL}?category=${this.category}&location=${this.state.location}`)
            shops = await response.json()
            window.localStorage.setItem(this.state.location, JSON.stringify(shops))
        }
        // Error check for API response
        if (!shops.message.error && shops.data.length !== 0) {
            this.showRandomShop(shops)
            this.createSeeAllNearby(shops)
        }
        else {
            this.showErrorText()
            this.hideHTML('weOutDiv')
            this.hideHTML('goButton')
            this.hideHTML('history-title')
            this.hideHTML('historyContainer')
        }
    }

    // Helper function to display a random boba shop
    showRandomShop(shops) {
        this.showWeOut()
        // RNG number from 0 to array length
        let RNG = Math.floor(Math.random() * shops.data.length)
        // Updating result container
        let container = document.getElementById('shopNameContainer')
        let errorContainer = document.getElementById('errorText')
        let ratingContainer = document.getElementById('yelpRating')
        let reviewCountContainer = document.getElementById('reviewCount')
        let locationRef = document.getElementById('locationRef')
        let address = shops.data[RNG].location.display_address
        locationRef.innerHTML = address.join(", ")

        // Adding content to history
        this.addShopToHistory(shops.data[RNG].name, shops.data[RNG].url)

        // Truncate result based on screen size
        let maxNameLength = 20
        let name = shops.data[RNG].name
        if (shops.data[RNG].name.length > maxNameLength && window.screen.width <= 600) {
            name = shops.data[RNG].name.substring(0, maxNameLength) + "..."
        }
        else {
            name = name + '!'
        }

        // Updating content of container
        errorContainer.innerHTML = ''
        container.innerHTML = name
        container.href = shops.data[RNG].url

        let rating = shops.data[RNG].rating
        ratingContainer.src = this.getStarImages(rating)

        reviewCountContainer.innerHTML = shops.data[RNG].review_count + ' Reviews'
    }

    // Helper function to add shop+url to history
    addShopToHistory(shop, url) {
        let div = document.getElementById("historyContainer");

        // Find potential duplicate in historyContainer div and remove it to readd it to the front
        let duplicates = div.querySelectorAll("a[href='"+url+"']");
        for (let i = 0; i < duplicates.length; i++) {
            div.removeChild(duplicates[i]);
        }

        // Removes the last entry in the history if the container reaches capacity
        if (div.childNodes.length >= this.maxHistory) {
            div.removeChild(div.lastChild);
        } 

        // Adds a new text node to the front of the history
        let item = document.createElement('a')
        item.href = url;
        item.innerHTML = shop;
        item.className = 'history';
        item.target = '_blank';
        div.insertBefore(item, div.firstChild);
    }

    // Helper function to return yelp star img based on rating
    getStarImages(rating) {

        switch (rating) {
            case 0:
                let zeroStars = require("../assets/yelpstars/regular_0@3x.png")
                return zeroStars

            case 1:
                let oneStars = require("../assets/yelpstars/regular_1@3x.png")
                return oneStars

            case 1.5:
                let oneHalfStars = require("../assets/yelpstars/regular_1_half@3x.png")
                return oneHalfStars

            case 2:
                let twoStars = require("../assets/yelpstars/regular_2@3x.png")
                return twoStars

            case 2.5:
                let twoHalfStars = require("../assets/yelpstars/regular_2_half@3x.png")
                return twoHalfStars

            case 3:
                let threeStars = require("../assets/yelpstars/regular_3@3x.png")
                return threeStars

            case 3.5:
                let threeHalfStars = require("../assets/yelpstars/regular_3_half@3x.png")
                return threeHalfStars

            case 4:
                let fourStars = require("../assets/yelpstars/regular_4@3x.png")
                return fourStars

            case 4.5:
                let fourHalfStars = require("../assets/yelpstars/regular_4_half@3x.png")
                return fourHalfStars

            case 5:
                let fiveStars = require("../assets/yelpstars/regular_5@3x.png")
                return fiveStars

            default:
                break
        }
    }

    // Helper function to create See all nearby modal
    createSeeAllNearby(shops) {
        let div = document.getElementById("seeAllScroller");
        // Clears the previous contents of the scroller
        while (div.firstChild) {
            div.removeChild(div.firstChild);
        }
        // Update the value of results
        let results = document.getElementById("seeAllContentResults")
        let numOfShops = shops.data.length;
        results.innerHTML = "Results ("+numOfShops+")";

        // Loop through nearby shops to add data to scroller contents 
        for (let i = 0; i < numOfShops; i++) {
            let name = shops.data[i].name;
            let rating = shops.data[i].rating;
            let url = shops.data[i].url;

            let entry = document.createElement('div');
            entry.className = "see-all-entry"

            // Create clickable name element in its own line
            let line = document.createElement('p');
            let shop = document.createElement('a');
            line.className = "see-all-entry-container"
            shop.className = "clickable see-all-entry-name";
            shop.href = url;
            shop.target = "_blank";
            shop.innerHTML = name;
            line.appendChild(shop);
            entry.appendChild(line);

            // Grab stars img and apply to entry
            let stars = document.createElement('img');
            stars.className = "clickable see-all-entry-stars";
            stars.alt = "yelp rating";
            stars.onclick = function(){window.open(url)};
            stars.src = this.getStarImages(rating);
            entry.appendChild(stars);

            // Adds dividers in between entries
            if (i < numOfShops-1) {
                let divider = document.createElement('hr');
                divider.className = "entry-divider";
                entry.appendChild(divider);
            }

            div.appendChild(entry);
        }
    }

    // Turns modal on or off
    setModal(on) {
        let modal = document.getElementById('seeAllModal');
        if (on) {
            modal.style.display = "block";
        } else {
            modal.style.display = "none";
        }
    }

    // Closes see all nearby modal on clicking outside of modal
    checkExitModalOnClick(event) {
        let modal = document.getElementById('seeAllModal');
        let x = document.getElementsByClassName("close")[0];
        if (event.target === modal) {
            console.log("yes");
        }

        if (event.target === modal || event.target === x) {
            modal.style.display = "none";    
        }
    }

    // Helper function to handle error condition
    showErrorText() {
        // TODO: I've created the error condition, do what you want with this part!
        let errorContainer = document.getElementById('errorText')
        errorContainer.innerHTML = 'We couldn&rsquo;t find bubble tea places matching your location.'
        this.showHTML('errorText')
        this.showHTML('tryAgain')
        this.hideHTML('loader')
        // console.log(shops.message.error)
    }

    // Helper function to render form
    renderForm() {
        return (
            <React.Fragment>
                <form>
                    <div>
                        <input id="locationInput" className="input-form" value={this.state.location} onChange={this.handleChange} placeholder={this.placeholder} onFocus={e => e.target.select()} />
                    </div>
                    <p id='errorText'></p>
                    {/*eslint-disable-next-line*/}
                    <div className="we-out" id="weOutDiv">
                        <span id="locationRef"></span>
                        {/*eslint-disable-next-line*/}
                        <p className="we-out-text">We out to <a target="_blank" id='shopNameContainer' href="#"></a></p>
                        <div className="loader" id="loader"></div>
                        <img height="20px" alt="yelp rating" id="yelpRating" src={require("../assets/yelpstars/regular_5@3x.png")} />
                        <span id="reviewCount"></span>
                    </div>
                    <div id="seeAllModal" onClick={this.checkExitModalOnClick} className="see-all">
                        <div className="see-all-content">
                            <span className="clickable close" onClick={() => {this.setModal(false);}}>&times;</span>
                            <h1 className="see-all-content-header">All nearby bubble tea spots</h1>
                            <p id="seeAllContentResults"></p>
                            <div id="seeAllScroller">

                            </div>
                            <button type="button" id="closeButton" className='clickable close-btn brown-btn' onClick={() => {this.setModal(false);}}>Close</button>
                        </div>
                    </div>
                    <br />
                    <button id="goButton" className='clickable brown-btn' onClick={this.handleSubmit}>See where we goin&rsquo;</button>
                </form>
                <span className="clickable under-btn" id="tryAgain" onClick={() => { 
                    this.showHTML('locationInput'); 
                    this.showHTML('goButton');
                    this.hideHTML('weOutDiv'); 
                    this.hideHTML('tryAgain');
                    this.hideHTML('seeAllNearby')
                    this.hideHTML('errorText');
                }}>Try another location</span>
                <span className="clickable under-btn" id="seeAllNearby" onClick={() => {this.setModal(true);}}>See all nearby</span>

                <p id="history-title">History</p>
                <div id="historyContainer">
                </div>
            </React.Fragment>
        )
    }

    render() {
        return (
            <div className="App">
                <header className="App-header">
                    <div className="flex-container">
                        <div className="main">
                            <h1 className="main-header">Where we goin&rsquo;  for<br />bubble tea?</h1>
                            {this.renderForm()}
                        </div> {/* end main */}
                        <BobaSVG />
                    </div> {/* end flex-container */}
                </header>
                <footer>
                    <small>Send us feedback at WWGFBT@gmail.com</small>
                    <br/>
                    <small>&copy; Copyright 2018, made with <span aria-labelledby="jsx-a11y/accessible-emoji" role="img">❤</span> in California</small>
                </footer>
            </div>
        );
    }


}
export default App;