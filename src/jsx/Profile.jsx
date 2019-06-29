import React, { Component } from "react";
import Vibrant from "node-vibrant";
import SongList from "./SongList";
import "../css/Profile.css";
import HorizontalList from "./HorizontalList";

import LikedIcon from "../resources/liked.svg";
import AddIcon from "../resources/add.svg";

export default class Profile extends Component {
    constructor(props) {
        super(props);

        const { type, id, image, name } = props;

        // Set information
        switch (type) {
            case "artist":
                var borderRadius = "50%";
                var background = image === "https://i.imgur.com/PgCafqK.png" ? null : image;
                break;

            case "album":
            default:
                borderRadius = "0.5rem";
                background = image === "https://i.imgur.com/iajaWIN.png" ? null : image;
                break;
        }

        // Get background main color
        if (background) {
            let v = new Vibrant(background);
            v.getPalette((err, palette) => {
                if (!err) this.setState({ imageColor: palette.Vibrant.getRgb() });
                else console.log(err);
            });
        }

        this.state = {
            type,
            id,
            borderRadius,
            image,
            background,
            name,
            imageColor: [150, 150, 150],

            albumsHeight: (window.innerWidth - 1.5 * 16) / 3 + 7,
            albumsWidth: (window.innerWidth - 1.5 * 16) / 3,
            albumsPadding: 0.5 * 16
        };
    }

    // Handle a click on the shuffle button
    handleShuffleClick = () => {
        // CARLES Shuffle
        console.log("Shuffle");
    };

    // Handle the click on an action
    handleActionClick = event => {
        const { type, id } = this.state;

        // Open the add to popup
        if (event === "onAddToClicked") {
            if (type === "album" && window.info.library.albums && id in window.info.library.albums) {
                var songIDs = Object.keys(window.info.library.albums[id].songs);
            } else if (window.info.library.artists && id in window.info.library.artists) {
                songIDs = Object.keys(window.info.library.artists[id].songs);
            } else return;

            window.PubSub.emit(event, { ids: songIDs });
            return;
        }

        window.PubSub.emit(event, { id, type });
    };

    // Handle a click on the back button
    handleBackClick = () => {
        const { type } = this.state;
        window.PubSub.emit("onClosePopup", { type });
    };

    // Renders the component
    render() {
        const { playbackState, songList, albumList } = this.props;
        const { type, id, borderRadius, image, background, name, albumsHeight, albumsWidth, albumsPadding, imageColor } = this.state;
        const { albumID, artistID } = playbackState;

        // Set information
        switch (type) {
            case "artist":
                var selected = artistID === id;
                var zIndex = 10;

                var albumObjects = Object.values(albumList).map(albumInfo => {
                    return {
                        id: albumInfo.albumID,
                        height: albumsHeight,
                        width: albumsWidth,
                        padding: albumsPadding,
                        name: albumInfo.name,
                        image: albumInfo.image,
                        selected: albumInfo.albumID === albumID
                    };
                });

                if (albumObjects.length) {
                    var albums = (
                        <div className="profile_albums" style={{ height: albumsHeight, zIndex: zIndex }}>
                            <HorizontalList elements={albumObjects} />
                        </div>
                    );
                } else albums = null;

                break;

            case "album":
            default:
                selected = albumID === id;
                zIndex = 20;
                albums = null;

                break;
        }

        // Prepare song actions
        var actions = {
            left: {
                numberOfActionsAlwaysVisible: 0,
                // Items in normal order (first one is in the left)
                list: [{ event: "onAddToClicked", type: "add" }]
            },
            right: {
                numberOfActionsAlwaysVisible: 0,
                // Items in reverse order (first one is in the right)
                list: [{ event: "onSongLikeClicked", type: "like" }]
            }
        };

        // Image gradient for the top of the window
        var imageGradient =
            "linear-gradient(to bottom, rgba(" + imageColor[0] + ", " + imageColor[1] + ", " + imageColor[2] + ", 0.3) 0%, rgba(0, 0, 0, 0) 5rem)";

        // Height of the album cover
        var imageHeight = window.innerWidth / 3;

        return (
            <div className="profile_wrapper">
                <div className="profile_background" style={{ backgroundImage: "url(" + background + ")", zIndex: zIndex - 5 }} />
                <div className="profile_backgroundBlurred" style={{ backgroundImage: "url(" + background + ")", zIndex: zIndex - 5 }} />
                <div className="profile_gradient" style={{ backgroundImage: imageGradient, zIndex: zIndex - 4 }} />
                <div className="profile_header" style={{ zIndex: zIndex }}>
                    <img
                        className="profile_image"
                        src={image}
                        alt=""
                        style={{ borderRadius: borderRadius, height: imageHeight, width: imageHeight }}
                    />

                    <p className={"profile_name" + (selected ? " profile_nameSelected" : "")}>{window.prettifyName(name)}</p>

                    <button
                        className="profile_actionButton profile_action_like"
                        onClick={() => this.handleActionClick("onProfileLikeClicked")}
                        style={{ top: "calc(" + imageHeight / 2 + "px - 1.5rem)" }}
                    >
                        <img className="profile_icon" src={LikedIcon} alt="" />
                    </button>

                    <button
                        className="profile_actionButton profile_action_add"
                        onClick={() => this.handleActionClick("onAddToClicked")}
                        style={{ top: "calc(" + imageHeight / 2 + "px - 1.5rem)" }}
                    >
                        <img className="profile_icon" src={AddIcon} alt="" />
                    </button>
                </div>
                <div className="profile_songs" style={{ zIndex: zIndex }}>
                    <SongList songList={songList} playbackState={playbackState} actions={actions} order="album" listenToOrderChange={false} />
                </div>
                {albums}
                <div className="profile_controls" style={{ zIndex: zIndex }}>
                    <button className="profile_shuffle" onClick={() => this.handleShuffleClick()}>
                        SHUFFLE
                    </button>
                    <button className="profile_back" onClick={() => this.handleBackClick()}>
                        Back
                    </button>
                </div>
            </div>
        );
    }
}
