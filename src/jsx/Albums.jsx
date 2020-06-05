import React, { Component } from "react";
import ItemAlbumArtist from "./ItemAlbumArtist";
import "../css/Albums.css";

import SortIcon from "../resources/sort.svg";

export default class Albums extends Component {
    constructor(props) {
        super(props);

        this.info = {
            longPressTimeout: null,
        };

        this.state = {
            scrollTop: 0,
            rowHeight: window.innerWidth / 1.75,

            // Get width of a single artist: window width - scrollbar width - 1.5 rem of margins
            albumWidth: (window.innerWidth - 7 - 1.5 * 16) / 2,
            albumPadding: 0.8 * 16,

            // Order
            sortRotation: 0,
            order: "dateAdded",
            listOrder: this.getListOrder("dateAdded"),
        };

        window.PubSub.sub("onLibraryLoaded", this.handleLibraryLoaded);
        window.PubSub.sub("onAlbumDeleted", this.handleLibraryLoaded);
    }

    // Called when the library finishes loading
    handleLibraryLoaded = () => {
        const { order } = this.state;
        this.setState({ listOrder: this.getListOrder(order) });
    };

    // Handle when the list is scrolled
    handleScroll = (event) => {
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
                { name: "Name", callbackName: "name", selected: order === "name" || order === "nameReversed" },
                { name: "Date Added", callbackName: "dateAdded", selected: order === "dateAdded" || order === "dateAddedReversed" },
            ];

            window.PubSub.emit("onSortByClicked", {
                items,
                callback: this.handleSortChange.bind(this),
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
            listOrder: this.getListOrder(newOrder),
        });
    };

    // Called when a different sort order is selected from the popup
    handleSortChange = (order) => {
        this.setState({ sortRotation: 0, order, listOrder: this.getListOrder(order) });
    };

    // Returns a list of song IDs in the order specified: ["name", "dateAdded"]
    getListOrder = (order) => {
        function orderFunction(a, b, order) {
            if (order === "name") {
                var orderA = a["name"];
                var orderB = b["name"];
            } else if (order === "nameReversed") {
                orderA = b["name"];
                orderB = a["name"];
            } else if (order === "dateAdded") {
                // Reversed so it orders recents first
                orderA = b["dateAdded"];
                orderB = a["dateAdded"];
            } else {
                orderA = a["dateAdded"];
                orderB = b["dateAdded"];
            }

            // If the first order is the same sort by album name
            if (orderA === orderB) {
                var albumA = window.info.library.albums[a["albumID"]].name;
                var albumB = window.info.library.albums[b["albumID"]].name;

                // If the album is the same sort by album id
                if (albumA === albumB) {
                    var idA = a["albumID"];
                    var idB = a["albumID"];
                    return idA > idB ? 1 : -1;
                } else {
                    return albumA > albumB ? 1 : -1;
                }
            } else {
                return orderA > orderB ? 1 : -1;
            }
        }

        return Object.values(window.info.library.albums)
            .sort((a, b) => orderFunction(a, b, order))
            .map((x) => x["albumID"]);
    };

    // Create the component from an element in the array
    createItem = (elem, skeleton) => {
        const { playbackState } = this.props;
        const { rowHeight, albumWidth, albumPadding } = this.state;
        const { id, name, image } = elem;
        return (
            <ItemAlbumArtist
                key={id}
                height={rowHeight}
                width={albumWidth}
                padding={albumPadding}
                id={id}
                name={name}
                image={image}
                selected={id === playbackState["albumID"]}
                skeleton={skeleton}
                type={"album"}
                noName={false}
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
                var { albumID, name, image } = window.info.library.albums[list[index]];
                renderedItems.push(this.createItem({ id: albumID, name: name, image: image }, false));
            } else if (list.length <= 0) {
                renderedItems.push(this.createItem({ id: index, name: "", image: "" }, true));
            }
            ++index;
        }

        return (
            <div
                className="albums_wrapper"
                style={{
                    padding: "0 0 " + margin / 2 + "px 0",
                    height: "calc(100% - " + margin / 2 + "px)",
                    backgroundImage: imageGradient,
                }}
            >
                <p className="albums_title">Liked Albums</p>
                <div className="albums_sortButton" ref={(elem) => (this.buttonDOM = elem)}>
                    <img className="albums_icon" src={SortIcon} alt="" style={{ transform: sortTransform }} />
                </div>
                <div className="albums_scroll" onScroll={this.handleScroll}>
                    <div style={{ height: totalHeight - paddingTop, paddingTop: paddingTop }}>
                        <ol className="albums_list">{renderedItems}</ol>
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
        window.PubSub.unsub("onAlbumDeleted", this.handleLibraryLoaded);
        this.buttonDOM.removeEventListener("touchstart", () => (this.info.longPressTimeout = setTimeout(() => this.handleSortLongPress(), 500)));
        this.buttonDOM.removeEventListener("touchend", () => this.handleSortClick());
    }
}
