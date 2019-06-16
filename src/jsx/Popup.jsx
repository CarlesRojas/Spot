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

    // Renders the component
    render() {
        const { callback } = this.props;
        const { items, name } = this.state;

        var itemElems = items.map(({ name, callbackName, selected }, index) => {
            return (
                <button key={index} className={"popup_button" + (selected ? " popup_buttonSelected" : "")} onClick={() => callback(callbackName)}>
                    {name}
                </button>
            );
        });

        return (
            <div className="popup_wrapper">
                <div className="popup_mainArea">
                    <p className="popup_title">{name}</p>
                    <div className="popup_itemList">{itemElems}</div>
                </div>
            </div>
        );
    }
}
