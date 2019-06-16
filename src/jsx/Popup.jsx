import React, { Component } from "react";
import "../css/Popup.css";

export default class Popup extends Component {
    constructor(props) {
        super(props);

        const { type, items } = props;

        // Set information
        switch (type) {
            case "sortBy":
                var name = "Sort by";
                break;

            case "addTo":
            default:
                name = "Add to";
                break;
        }

        this.state = { type, items, name };
    }

    // Handle a click on the back button
    handleBackClick = () => {
        const { type } = this.state;
        window.PubSub.emit("onClosePopup", { type });
    };

    // Handle click on an option
    handleOptionClick = (callback, callbackName) => {
        callback(callbackName);
        this.handleBackClick();
    };

    // Renders the component
    render() {
        const { callback } = this.props;
        const { items, name } = this.state;

        var itemElems = items.map(({ name, callbackName, selected }, index) => {
            return (
                <button key={index} className={"popup_button" + (selected ? " popup_buttonSelected" : "")} onClick={() => this.handleOptionClick(callback, callbackName)}>
                    {name}
                </button>
            );
        });

        // Image gradient for the top of the window
        var imageGradient = "linear-gradient(to bottom, rgba(29, 185, 84, 0.3) 0%, rgba(0, 0, 0, 0) 5rem)";

        return (
            <div className="popup_wrapper">
                <div className="popup_gradient" style={{ backgroundImage: imageGradient }} />
                <div className="popup_mainArea">
                    <p className="popup_title">{name}</p>
                    <div className="popup_itemList">{itemElems}</div>
                    <button className="popup_back" onClick={() => this.handleBackClick()}>
                        Back
                    </button>
                </div>
                <div className="popup_closeArea" ref={elem => (this.wrapperDOM = elem)} />
            </div>
        );
    }
    // Called when the component mounts
    componentDidMount() {
        this.wrapperDOM.addEventListener("touchstart", () => this.handleBackClick());
    }

    // Called when the component unmounts
    componentWillUnmount() {
        this.wrapperDOM.removeEventListener("touchstart", () => this.handleBackClick());
    }
}
