import React, { Component } from "react";
import ItemArtist from "./ItemArtist";
import "../css/Artists.css";

export default class Artists extends Component {
    constructor(props) {
        super(props);

        const { height } = props;

        this.state = {
            availableHeight: height,
            scrollTop: 0,
            rowHeight: window.innerWidth / 1.75,
            order: null
        };

        window.PubSub.sub("onLibraryLoaded", this.handleLibraryLoaded);

        if (!window.info.artistList || window.info.artistList.length <= 0) window.info.artistList = this.getListOrder("dateAdded");
    }

    // Called when the library finishes loading
    handleLibraryLoaded = () => {
        if (!window.info.artistList || window.info.artistList.length <= 0) {
            window.info.artistList = this.getListOrder("dateAdded");
            this.forceUpdate();
        }
    };

    // Handle when the list is scrolled
    handleScroll = event => {
        this.setState({ scrollTop: event.target.scrollTop });
    };

    // Returns a list of song IDs in the order specified: ["name", "dateAdded"]
    getListOrder = order => {
        function orderFunction(a, b, order) {
            if (order === "name") {
                var orderA = a["name"];
                var orderB = b["name"];
            } else {
                // Reversed so it orders recents first
                orderA = b["dateAdded"];
                orderB = a["dateAdded"];
            }

            // If the first order is the same sort by artist name
            if (orderA === orderB) {
                var albumA = window.info.library.artists[a["artistID"]].name;
                var albumB = window.info.library.artists[b["artistID"]].name;

                // If the artist is the same sort by artist id
                if (albumA === albumB) {
                    var idA = a["artistID"];
                    var idB = a["artistID"];
                    return idA > idB ? 1 : -1;
                } else {
                    return albumA > albumB ? 1 : -1;
                }
            } else {
                return orderA > orderB ? 1 : -1;
            }
        }

        return Object.values(window.info.library.artists)
            .sort((a, b) => orderFunction(a, b, order))
            .map(x => x["artistID"]);
    };

    // Create the component from an element in the array
    createItem = (elem, skeleton) => {
        const { playbackState } = this.props;
        const { rowHeight } = this.state;
        const { id, name, image } = elem;
        return <ItemArtist key={id} height={rowHeight} id={id} name={name} image={image} selected={id === playbackState["artistID"]} skeleton={skeleton} />;
    };

    // Renders the component
    render() {
        const { imageGradient } = this.props;
        const { availableHeight, scrollTop, rowHeight } = this.state;
        const list = window.info.artistList;
        const numRows = list.length > 0 ? Math.ceil(list.length / 2) : 20;
        const margin = (window.innerWidth / 100) * 5;

        const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) * 2 - 10);
        const endIndex = Math.min(startIndex + Math.ceil(availableHeight / rowHeight) * 2 + 20, numRows * 2);
        const totalHeight = rowHeight * numRows;
        const paddingTop = (startIndex * rowHeight) / 2;

        // List to be rendered
        const renderedItems = [];
        let index = startIndex;

        // Add all items that will be shown
        while (index < endIndex) {
            if (index < list.length) {
                var { artistID, name, image } = window.info.library.artists[list[index]];
                renderedItems.push(this.createItem({ id: artistID, name: name, image: image }, false));
            } else if (list.length <= 0) {
                renderedItems.push(this.createItem({ id: index, name: "", image: "" }, true));
            }
            ++index;
        }

        return (
            <div className="artists_wrapper" style={{ padding: "0 0 " + margin / 2 + "px 0", height: "calc(100% - " + margin / 2 + "px)", backgroundImage: imageGradient }}>
                <p className="artists_title">Liked Artists</p>
                <div className="artists_scroll" onScroll={this.handleScroll}>
                    <div style={{ height: totalHeight - paddingTop, paddingTop: paddingTop }}>
                        <ol className="artists_list">{renderedItems}</ol>
                    </div>
                </div>
            </div>
        );
    }

    // Stop listening to events
    componentWillUnmount() {
        window.PubSub.unsub("onLibraryLoaded", this.handleLibraryLoaded);
    }
}
