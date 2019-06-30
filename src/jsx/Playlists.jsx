import React, { Component } from "react";
import ItemPlaylist from "./ItemPlaylist";
import "../css/Playlists.css";

import SortIcon from "../resources/sort.svg";

export default class Playlists extends Component {
    constructor(props) {
        super(props);

        this.info = {
            longPressTimeout: null
        };

        this.state = {
            scrollTop: 0,
            rowHeight: window.innerWidth / 4,

            // Order
            sortRotation: 0,
            order: "dateAdded",
            listOrder: this.getListOrder("dateAdded")
        };

        window.PubSub.sub("onLibraryLoaded", this.handleLibraryLoaded);
    }

    // Called when the library finishes loading
    handleLibraryLoaded = () => {
        const { order } = this.state;
        this.setState({ listOrder: this.getListOrder(order) });
    };

    // Handle when the list is scrolled
    handleScroll = event => {
        this.setState({ scrollTop: event.target.scrollTop });
    };

    // Called when the sort icon is clicked
    handleSortClick = () => {
        const { order } = this.state;

        // Is the timeout is still there, then it is a short click
        if (this.info.longPressTimeout) {
            clearTimeout(this.info.longPressTimeout);
            this.info.longPressTimeout = null;

            var items = [
                {
                    name: "Name",
                    callbackName: "name",
                    selected: order === "name" || order === "nameReversed"
                },
                {
                    name: "Date Added",
                    callbackName: "dateAdded",
                    selected: order === "dateAdded" || order === "dateAddedReversed"
                }
            ];

            window.PubSub.emit("onSortByClicked", {
                items,
                callback: this.handleSortChange.bind(this)
            });
        }
    };

    // Called when the sort icon is long pressed
    handleSortLongPress = () => {
        const { sortRotation, order } = this.state;
        clearTimeout(this.info.longPressTimeout);
        this.info.longPressTimeout = null;

        if (order === "name") var newOrder = "nameReversed";
        else if (order === "nameReversed") newOrder = "name";
        else if (order === "dateAdded") newOrder = "dateAddedReversed";
        else if (order === "dateAddedReversed") newOrder = "dateAdded";

        this.setState({
            sortRotation: sortRotation === 0 ? 180 : 0,
            order: newOrder,
            listOrder: this.getListOrder(newOrder)
        });
    };

    // Called when a different sort order is selected from the popup
    handleSortChange = order => {
        this.setState({ sortRotation: 0, order, listOrder: this.getListOrder(order) });
    };

    // Returns a list of playlist IDs in the order specified: ["name", "dateAdded"]
    getListOrder = order => {
        function orderFunction(a, b, order) {
            if (order === "name") {
                var orderA = a["name"];
                var orderB = b["name"];
            } else if (order === "nameReversed") {
                orderA = b["name"];
                orderB = a["name"];
            } else if (order === "dateAdded") {
                orderA = a["dateAdded"];
                orderB = b["dateAdded"];
            } else {
                orderA = b["dateAdded"];
                orderB = a["dateAdded"];
            }

            return orderA > orderB ? 1 : -1;
        }

        return Object.values(window.info.library.playlists)
            .sort((a, b) => orderFunction(a, b, order))
            .map(x => x["playlistID"]);
    };

    // Create the component from an element in the array
    createItem = (elem, skeleton) => {
        const { playbackState } = this.props;
        const { rowHeight } = this.state;
        const { id, name, image } = elem;
        return (
            <ItemPlaylist
                key={id}
                id={id}
                height={rowHeight}
                name={name}
                image={image}
                selected={id === playbackState["playlistID"]}
                skeleton={skeleton}
            />
        );
    };

    // Renders the component
    render() {
        const { imageGradient } = this.props;
        const { scrollTop, rowHeight, listOrder, sortRotation } = this.state;
        const list = listOrder;
        const numRows = list.length > 0 ? Math.ceil(list.length / 2) : 20;
        const margin = (window.innerWidth / 100) * 5;
        const sortTransform = "rotate( " + sortRotation + "deg)";

        const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) * 2 - 10);
        const endIndex = Math.min(startIndex + 30, numRows * 2);
        const totalHeight = rowHeight * numRows;
        const paddingTop = (startIndex * rowHeight) / 2;

        // List to be rendered
        const renderedItems = [];
        let index = startIndex;

        // Add all items that will be shown
        while (index < endIndex) {
            if (index < list.length) {
                var { playlistID, name, image } = window.info.library.playlists[list[index]];
                renderedItems.push(this.createItem({ id: playlistID, name: name, image: image }, false));
            } else if (list.length <= 0) {
                renderedItems.push(this.createItem({ id: index, name: "", image: "" }, true));
            }
            ++index;
        }

        return (
            <div
                className="playlists_wrapper"
                style={{
                    padding: "0 0 " + margin / 2 + "px 0",
                    height: "calc(100% - " + margin / 2 + "px)",
                    backgroundImage: imageGradient
                }}
            >
                <p className="playlists_title">Playlists</p>
                <div className="playlists_sortButton" ref={elem => (this.buttonDOM = elem)}>
                    <img className="playlists_icon" src={SortIcon} alt="" style={{ transform: sortTransform }} />
                </div>
                <div className="playlists_scroll" onScroll={this.handleScroll}>
                    <div style={{ height: totalHeight - paddingTop, paddingTop: paddingTop }}>
                        <ol className="playlists_list">{renderedItems}</ol>
                    </div>
                </div>
            </div>
        );
    }

    // Called when the component mounts
    componentDidMount() {
        this.buttonDOM.addEventListener("touchstart", () => (this.info.longPressTimeout = setTimeout(() => this.handleSortLongPress(), 500)));
        this.buttonDOM.addEventListener("touchend", () => this.handleSortClick());
    }

    // Stop listening to events
    componentWillUnmount() {
        window.PubSub.unsub("onLibraryLoaded", this.handleLibraryLoaded);
        this.buttonDOM.removeEventListener("touchstart", () => (this.info.longPressTimeout = setTimeout(() => this.handleSortLongPress(), 500)));
        this.buttonDOM.removeEventListener("touchend", () => this.handleSortClick());
    }
}
