import React, { Component } from "react";
import Vibrant from "node-vibrant";
import SongList from "./SongList";
import "../css/Profile.css";
import HorizontalList from "./HorizontalList";

export default class Profile extends Component {
    constructor(props) {
        super(props);

        const { type, id } = props;

        // Set information
        if (window.info && window.info.library && window.info.library.artists && window.info.library.albums) {
            switch (type) {
                case "artist":
                    var borderRadius = "50%";
                    var image = id in window.info.library.artists ? window.info.library.artists[id].image : "https://i.imgur.com/PgCafqK.png";
                    var background = image === "https://i.imgur.com/PgCafqK.png" ? null : image;
                    var name = id in window.info.library.artists ? window.info.library.artists[id].name : "Unknown Artist";
                    break;

                case "album":
                default:
                    borderRadius = "0.5rem";
                    image = id in window.info.library.albums ? window.info.library.albums[id].image : "https://i.imgur.com/iajaWIN.png";
                    background = image === "https://i.imgur.com/iajaWIN.png" ? null : image;
                    name = id in window.info.library.albums ? window.info.library.albums[id].name : "Unknown Album";
                    break;
            }
        } else {
            borderRadius = "0rem";
            image = "https://i.imgur.com/iajaWIN.png";
            background = null;
            name = "Unknown Album";
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

            albumsWidth: (window.innerWidth - 1.5 * 16) / 3, // 1.5 rem
            albumsPadding: 0.5 * 16 // 0.5 rems
            albumsHeight: (window.innerWidth - 1.5 * 16) / 3 + 7,
        };

        // Sub to events when this component is mounted
        window.PubSub.sub("onLibraryLoaded", this.handleLibraryLoaded);
    }

    // Called when the library finishes loading
    handleLibraryLoaded = () => {
        const { type, id } = this.props;

        switch (type) {
            case "artist":
                var borderRadius = "50%";
                var image = id in window.info.library.artists ? window.info.library.artists[id].image : "https://i.imgur.com/PgCafqK.png";
                var background = image === "https://i.imgur.com/PgCafqK.png" ? null : image;
                var name = id in window.info.library.artists ? window.info.library.artists[id].name : "Unknown Artist";
                break;

            case "album":
            default:
                borderRadius = "0.5rem";
                image = id in window.info.library.albums ? window.info.library.albums[id].image : "https://i.imgur.com/iajaWIN.png";
                background = image === "https://i.imgur.com/iajaWIN.png" ? null : image;
                name = id in window.info.library.albums ? window.info.library.albums[id].name : "Unknown Album";
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

        this.setState({
            borderRadius,
            image,
            background,
            name
        });
    };

    // Handle a click on the shuffle button
    handleShuffleClick = () => {
        // CARLES Shuffle
        console.log("Shuffle");
    };

    // Handle a click on the back button
    handleBackClick = () => {
        const { type } = this.state;

        window.PubSub.emit("onClosePopup", { type });
    };

    // Renders the component
    render() {
        const { playbackState } = this.props;
        const { type, id, borderRadius, image, background, name, albumsHeight, albumsWidth, albumsPadding, imageColor } = this.state;
        const { albumID } = playbackState;

        // Set information
        var selected = artistID === id;
        switch (type) {
            case "artist":
                var zIndex = 10;
                if (id in window.info.library.artists) {
                    var albumObjects = Object.keys(window.info.library.artists[id].albums).map(elemID => {
                        return {
                            id: elemID,
                            height: albumsHeight,
                            width: albumsWidth,
                            padding: albumsPadding,
                            name: elemID in window.info.library.albums ? window.info.library.albums[elemID].name : "Unknown Album",
                            image: elemID in window.info.library.albums ? window.info.library.albums[elemID].image : "https://i.imgur.com/iajaWIN.png",
                            selected: elemID === albumID
                        };
                    });

                    var albums = (
                        <div className="profile_albums" style={{ height: albumsHeight, zIndex: zIndex }}>
                            <HorizontalList elements={albumObjects} />
                        </div>
                    );
                } else albums = null;

                break;

            case "album":
            default:
                zIndex = 20;
                albums = null;
                break;
        }

        var imageGradient = "linear-gradient(to bottom, rgba(" + imageColor[0] + ", " + imageColor[1] + ", " + imageColor[2] + ", 0.3) 0%, rgba(0, 0, 0, 0) 5rem)";

        // Get width of a single artist: window width - scrollbar width - 1.5 rem of margins - 0.8 * 4 rem of padding devided by 2
        var width = window.innerWidth / 3;

        return (
            <div className="profile_wrapper">
                <div className="profile_background" style={{ backgroundImage: "url(" + background + ")", zIndex: zIndex - 5 }} />
                <div className="profile_backgroundBlurred" style={{ backgroundImage: "url(" + background + ")", zIndex: zIndex - 5 }} />
                <div className="profile_gradient" style={{ backgroundImage: imageGradient, zIndex: zIndex - 4 }} />
                <div className="profile_header" style={{ zIndex: zIndex }}>
                    <img className="profile_image" src={image} alt="" style={{ borderRadius: borderRadius, height: width, width: width }} />
                    <p className={"profile_name" + (selected ? " profile_nameSelected" : "")}>{window.prettifyName(name)}</p>
                </div>
                <div className="profile_songs" style={{ zIndex: zIndex }}>
                    <SongList songList={window.info.library.songs} playbackState={playbackState} />
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

    // Stop listening to events
    componentWillUnmount() {
        window.PubSub.unsub("onLibraryLoaded", this.handleLibraryLoaded);
    }
}
