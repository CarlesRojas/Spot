import React, { Component } from "react";
import ItemSong from "./ItemSong";
import "../css/Songs.css";

export default class Songs extends Component {
    constructor(props) {
        super(props);

        const { height } = props;

        this.state = {
            availableHeight: height,
            scrollTop: 0,
            rowHeight: window.innerHeight / 11,
            order: null
        };

        window.PubSub.sub("onLibraryLoaded", this.handleLibraryLoaded);

        if (!window.info.songList || window.info.songList.length <= 0) window.info.songList = this.getListOrder("dateAdded");
    }

    // Called when the library finishes loading
    handleLibraryLoaded = () => {
        if (!window.info.songList || window.info.songList.length <= 0) {
            window.info.songList = this.getListOrder("dateAdded");
            this.forceUpdate();
        }
    };

    // Handle when the list is scrolled
    handleScroll = event => {
        this.setState({ scrollTop: event.target.scrollTop });
    };

    // Returns a list of song IDs in the order specified: ["name", "album", "artist", "dateAdded"]
    getListOrder = order => {
        function orderFunction(a, b, order) {
            if (order === "name") {
                var orderA = a["name"];
                var orderB = b["name"];
            } else if (order === "album") {
                orderA = window.info.library.albums[a["albumID"]].name;
                orderB = window.info.library.albums[b["albumID"]].name;
            } else if (order === "artist") {
                orderA = window.info.library.artists[a["artistID"]].name;
                orderB = window.info.library.artists[b["artistID"]].name;
            } else {
                // Reversed so it orders recents first
                orderA = b["dateAdded"];
                orderB = a["dateAdded"];
            }

            // If the first order is the same sort by album name
            if (orderA === orderB) {
                var albumA = window.info.library.albums[a["albumID"]].name;
                var albumB = window.info.library.albums[b["albumID"]].name;

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

        return Object.values(window.info.library.songs)
            .sort((a, b) => orderFunction(a, b, order))
            .map(x => x["songID"]);
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
        const { imageGradient } = this.props;
        const { availableHeight, scrollTop, rowHeight } = this.state;
        const list = window.info.songList;
        const numRows = list.length > 0 ? list.length : 20;
        const margin = (window.innerWidth / 100) * 5;

        const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - 10);
        const endIndex = Math.min(startIndex + Math.ceil(availableHeight / rowHeight) + 20, numRows);
        const totalHeight = rowHeight * numRows;
        const paddingTop = startIndex * rowHeight;

        // List to be rendered
        const renderedItems = [];
        let index = startIndex;

        // Add all items that will be shown
        while (index < endIndex) {
            if (index < list.length) {
                var { songID, name, albumID, artistID } = window.info.library.songs[list[index]];
                renderedItems.push(
                    this.createItem({ id: songID, name: name, album: window.info.library.albums[albumID]["name"], artist: window.info.library.artists[artistID]["name"], albumID, artistID }, false)
                );
            } else {
                renderedItems.push(this.createItem({ id: index, name: "", album: "", artist: "", albumID: "", artistID: "" }, true));
            }
            ++index;
        }

        return (
            <div className="songs_wrapper" style={{ padding: "0 0 " + margin / 2 + "px 0", height: "calc(100% - " + margin / 2 + "px)", backgroundImage: imageGradient }}>
                <p className="songs_title">Liked Songs</p>
                <button className="songs_shuffle">SHUFFLE</button>
                <div className="songs_scroll" onScroll={this.handleScroll}>
                    <div style={{ height: totalHeight - paddingTop, paddingTop: paddingTop }}>
                        <ol className="songs_list">{renderedItems}</ol>
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
