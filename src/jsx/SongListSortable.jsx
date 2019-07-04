import React, { Component } from "react";
import ItemSong from "./ItemSong";
import { sortableContainer, sortableElement, sortableHandle } from "react-sortable-hoc";
import arrayMove from "array-move";
import "../css/SongListSortable.css";

const SortableItem = sortableElement(({ value }) => value);

const SortableContainer = sortableContainer(({ children }) => {
    return <ul className="songListSortable_list">{children}</ul>;
});

export default class SongListSortable extends Component {
    constructor(props) {
        super(props);

        const { order, listenToOrderChange } = props;

        this.state = {
            scrollTop: 0,
            rowHeight: window.innerHeight / 11,
            listOrder: this.getListOrder(order)
        };

        // Special case for library song list
        window.PubSub.sub("onLibraryLoaded", this.handleLibraryLoaded);
        window.PubSub.sub("onSongDeleted", this.handleLibraryLoaded);
        if (listenToOrderChange) window.PubSub.sub("onSongOrderChange", this.handleSongOrderChange);
    }

    // Called when the library finishes loading
    handleLibraryLoaded = () => {
        const { order } = this.props;
        this.setState({ listOrder: this.getListOrder(order) });
    };

    // Handle a change in order in the list
    handleSongOrderChange = ({ order }) => {
        this.setState({ listOrder: this.getListOrder(order) });
    };

    // Returns a list of song IDs in the order specified: ["album", "name", "nameReversed", "dateAdded", "dateReversed"]
    getListOrder = order => {
        const { songList } = this.props;
        console.log(songList);

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
            } else if (order === "dateReversed") {
                orderA = a["dateAdded"];
                orderB = b["dateAdded"];
            } else {
                orderA = a["albumID"];
                orderB = b["albumID"];
            }

            // If the first order is the same sort by album name
            if (orderA === orderB) {
                var albumA = a["albumName"];
                var albumB = b["albumName"];

                // If the album is the same sort by track number
                if (albumA === albumB) {
                    var trackNumA = a["trackNumber"];
                    var trackNumB = b["trackNumber"];
                    return trackNumA >= trackNumB ? 1 : -1;
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
        window.PubSub.emit("onCloseSongActions");
        this.setState({ scrollTop: event.target.scrollTop });
    };

    // Handle a song being deleted
    handleDeleteSong = id => {
        var list = [...this.state.listOrder];
        var index = list.indexOf(id);
        if (index > -1) list.splice(index, 1);
        this.setState({ listOrder: list });
    };

    // Handles a song being sorted
    handleSortEnd = ({ oldIndex, newIndex }) => {
        this.setState(({ listOrder }) => ({
            listOrder: arrayMove(listOrder, oldIndex, newIndex)
        }));
    };

    // Create the component from an element in the array
    createItem = (elem, skeleton) => {
        const { playbackState, actions } = this.props;
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
                actions={actions}
                onDelete={() => this.handleDeleteSong(id)}
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
            <div className="songListSortable_scroll" onScroll={this.handleScroll}>
                <div style={{ height: totalHeight - paddingTop, paddingTop: paddingTop }}>
                    <SortableContainer onSortEnd={this.handleSortEnd} lockAxis="y" useDragHandle>
                        {renderedItems.map((value, index) => (
                            <SortableItem key={"item" + index} index={index} value={value} />
                        ))}
                    </SortableContainer>
                </div>
            </div>
        );
    }

    // Stop listening to events
    componentWillUnmount() {
        window.PubSub.unsub("onLibraryLoaded", this.handleLibraryLoaded);
        window.PubSub.unsub("onSongDeleted", this.handleLibraryLoaded);
        window.PubSub.unsub("onSongOrderChange", this.handleSongOrderChange);
    }
}
