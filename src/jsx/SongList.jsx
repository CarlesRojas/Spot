import React, { Component } from "react";
import ItemSong from "./ItemSong";
import "../css/SongList.css";

export default class SongList extends Component {
    constructor(props) {
        super(props);

        const { height } = props;

        this.state = {
            availableHeight: height,
            scrollTop: 0,
            rowHeight: window.innerHeight / 11,
            order: null,
            listOrder: this.getListOrder("dateAdded")
        };

        // Special case for library song list
        window.PubSub.sub("onLibraryLoaded", this.handleLibraryLoaded);
    }

    // Called when the library finishes loading
    handleLibraryLoaded = () => {
        this.setState({ listOrder: this.getListOrder("dateAdded") });
    };

    // Returns a list of song IDs in the order specified: ["name", "album", "artist", "dateAdded"]
    getListOrder = order => {
        const { songList } = this.props;

        function orderFunction(a, b, order) {
            if (order === "name") {
                var orderA = a["name"];
                var orderB = b["name"];
            } else if (order === "album") {
                orderA = a["albumName"];
                orderB = b["albumName"];
            } else if (order === "artist") {
                orderA = a["artistName"];
                orderB = b["artistName"];
            } else {
                // Reversed so it orders recents first
                orderA = b["dateAdded"];
                orderB = a["dateAdded"];
            }

            // If the first order is the same sort by album name
            if (orderA === orderB) {
                var albumA = a["albumName"];
                var albumB = b["albumName"];

                // If the album is the same sort by track number
                if (albumA === albumB) {
                    var trackNumA = a["trackNumber"];
                    var trackNumB = a["trackNumber"];
                    return trackNumA <= trackNumB ? 1 : -1;
                } else {
                    return albumA > albumB ? 1 : -1;
                }
            } else {
                return orderA > orderB ? 1 : -1;
            }
        }

        return Object.values(songList)
            .sort((a, b) => orderFunction(a, b, order))
            .map(x => x["songID"]);
    };

    // Handle when the list is scrolled
    handleScroll = event => {
        this.setState({ scrollTop: event.target.scrollTop });
    };

    // Create the component from an element in the array
    createItem = (elem, skeleton) => {
        const { playbackState } = this.props;
        const { rowHeight } = this.state;
        const { id, name, album, artist, albumID, artistID } = elem;

        return (
            <ItemSong
                key={id}
                height={rowHeight}
                id={id}
                name={name}
                album={album}
                artist={artist}
                albumID={albumID}
                artistID={artistID}
                selected={id === playbackState["songID"]}
                skeleton={skeleton}
            />
        );
    };

    // Renders the component
    render() {
        const { songList } = this.props;
        const { scrollTop, rowHeight, listOrder } = this.state;
        const list = listOrder;
        const numRows = list.length > 0 ? list.length : 20;

        const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - 20);
        const endIndex = Math.min(startIndex + 30, numRows);
        const totalHeight = rowHeight * numRows;
        const paddingTop = startIndex * rowHeight;

        // List to be rendered
        const renderedItems = [];
        let index = startIndex;

        // Add all items that will be shown
        while (index < endIndex) {
            if (index < list.length) {
                var { songID, name, albumID, artistID, albumName, artistName } = songList[list[index]];
                renderedItems.push(this.createItem({ id: songID, name, album: albumName, artist: artistName, albumID, artistID }, false));
            } else {
                renderedItems.push(this.createItem({ id: index, name: "", album: "", artist: "", albumID: "", artistID: "" }, true));
            }
            ++index;
        }

        return (
            <div className="songList_scroll" onScroll={this.handleScroll}>
                <div style={{ height: totalHeight - paddingTop, paddingTop: paddingTop }}>
                    <ol className="songList_list">{renderedItems}</ol>
                </div>
            </div>
        );
    }

    // Stop listening to events
    componentWillUnmount() {
        const { type } = this.props;
        if (type === "librarySongs") window.PubSub.unsub("onLibraryLoaded", this.handleLibraryLoaded);
    }
}
