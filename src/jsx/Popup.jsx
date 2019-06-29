import React, { Component } from "react";
import "../css/Popup.css";

export default class Popup extends Component {
    constructor(props) {
        super(props);

        const { type, items } = props;

        // Set information
        switch (type) {
            case "sortBy":
                var name = "SORT BY";
                break;

            case "addTo":
            default:
                name = "ADD TO";
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
                <button
                    key={index}
                    className={"popup_button" + (selected ? " popup_buttonSelected" : "")}
                    onClick={() => this.handleOptionClick(callback, callbackName)}
                >
                    {name}
                </button>
            );
        });

        const margin = (window.innerWidth / 100) * 5;
        const maxHeight = "calc(100% - 3rem - " + (window.innerWidth / 4 + margin) + "px)";

        return (
            <div className="popup_wrapper">
                <div className="popup_mainArea" style={{ maxHeight: maxHeight }}>
                    <div className="popup_titleWrapper">
                        <p className="popup_title">{name}</p>
                    </div>

                    <div className="popup_itemList">{itemElems}</div>
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
