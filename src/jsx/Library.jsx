import React, { Component } from "react";
import Vibrant from "node-vibrant";
import Songs from "./Songs";
import Albums from "./Albums";
import Artists from "./Artists";
import Playlists from "./Playlists";
import Search from "./Search";
import SongIcon from "../resources/song.svg";
import AlbumIcon from "../resources/album.svg";
import ArtistIcon from "../resources/artist.svg";
import PlaylistIcon from "../resources/playlist.svg";
import SearchIcon from "../resources/search.svg";
import "../css/Library.css";

export default class Library extends Component {
    constructor(props) {
        super(props);

        this.state = {
            libraryOpen: false,
            libraryHeight: 0,
            libraryOpacity: 0,
            sections: [
                {
                    name: "song",
                    icon: SongIcon,
                    left: "0%"
                },
                {
                    name: "album",
                    icon: AlbumIcon,
                    left: "-100%"
                },
                {
                    name: "artist",
                    icon: ArtistIcon,
                    left: "-200%"
                },
                {
                    name: "playlist",
                    icon: PlaylistIcon,
                    left: "-300%"
                },
                {
                    name: "search",
                    icon: SearchIcon,
                    left: "-400%"
                }
            ],
            prevSectionName: null,
            currSectionName: "song"
        };

        this.info = {
            imageColor: [150, 150, 150]
        };

        // Sub to events when this component is mounted
        window.PubSub.sub("onSectionChange", this.handleSectionChange);
        window.PubSub.sub("onVerticalSwipe", this.handleVerticalSwipe);
    }

    // Handle the click to a new section
    handleSectionChange = ({ name }) => {
        this.setState(prevState => {
            if (prevState.currSectionName === name) return;
            else
                return {
                    prevSectionName: prevState.currSectionName,
                    currSectionName: name
                };
        });
    };

    // Handle a change in the cover position
    handleVerticalSwipe = ({ normalHeight, smallHeigth, normalTop, miniatureTop, currentSongsTop, currentHeight, currentTop }) => {
        // Function to map a number to another range
        function mapNumber(number, inputMin, inputMax, outputMin, outputMax) {
            return ((number - inputMin) * (outputMax - outputMin)) / (inputMax - inputMin) + outputMin;
        }

        // Hide if the library is not open
        if (currentTop <= normalTop) {
            this.setState({ libraryOpen: false, libraryHeight: 0, libraryOpacity: 0 });
        }

        // Show if the library is open
        else if (currentTop >= miniatureTop) {
            this.setState({ libraryOpen: true, libraryHeight: miniatureTop, libraryOpacity: 1 });
        }

        // Fade the library in or out
        else {
            this.setState({ libraryOpen: true, libraryHeight: currentTop, libraryOpacity: mapNumber(currentTop, normalTop, miniatureTop, 0, 1) });
        }
    };

    // Returns the info of the section
    getSectionInfo = sectionName => {
        for (var i = 0; i < this.state.sections.length; ++i) {
            if (this.state.sections[i].name === sectionName) return this.state.sections[i];
        }
        return { name: "song", icon: SongIcon, left: "0%" };
    };

    // Renders the component
    render() {
        const { playbackState } = this.props;
        const { libraryOpen, libraryHeight, libraryOpacity, currSectionName } = this.state;

        // Show or hide this section
        if (libraryOpen) var display = "inline";
        else display = "none";

        // Set the left property
        var left = this.getSectionInfo(currSectionName).left;

        // Extract the color from the currently playing image
        if (playbackState.image) {
            let v = new Vibrant(playbackState.image);
            v.getPalette((err, palette) => (!err ? (this.info.imageColor = palette.Vibrant.getRgb()) : console.log(err)));
        }
        var imageGradient = "linear-gradient(to bottom, rgba(" + this.info.imageColor[0] + ", " + this.info.imageColor[1] + ", " + this.info.imageColor[2] + ", 0.3) 0%, rgba(0, 0, 0, 0) 5rem)";

        return (
            <div className="library_wrapper" style={{ height: libraryHeight, opacity: libraryOpacity, display: display }}>
                <div className="library_sectionsWrapper" style={{ left: left }}>
                    <div className="library_sectionWrapper">
                        <Songs playbackState={playbackState} imageGradient={imageGradient} isOpen={currSectionName === "song"} />
                    </div>

                    <div className="library_sectionWrapper">
                        <Albums playbackState={playbackState} height={libraryHeight} imageGradient={imageGradient} isOpen={currSectionName === "album"} />
                    </div>

                    <div className="library_sectionWrapper">
                        <Artists playbackState={playbackState} height={libraryHeight} imageGradient={imageGradient} isOpen={currSectionName === "artist"} />
                    </div>

                    <div className="library_sectionWrapper">
                        <Playlists playbackState={playbackState} height={libraryHeight} imageGradient={imageGradient} isOpen={currSectionName === "playlist"} />
                    </div>

                    <div className="library_sectionWrapper">
                        <Search playbackState={playbackState} height={libraryHeight} imageGradient={imageGradient} isOpen={currSectionName === "search"} />
                    </div>
                </div>

                <div className="library_navBar">
                    {this.state.sections.map(section => (
                        <NavItem key={section.name} name={section.name} icon={section.icon} selected={section.name === this.state.currSectionName} />
                    ))}
                </div>
            </div>
        );
    }

    // Unsub from events when this component gets unmounted
    componentWillUnmount() {
        window.PubSub.unsub("onSectionChange", this.handleSectionChange);
        window.PubSub.unsub("onVerticalSwipe", this.handleVerticalSwipe);
    }
}

class NavItem extends Component {
    // Renders the component
    render() {
        const { name, icon, selected } = this.props;
        return (
            <button className={"navItem_button" + (selected ? " navItem_buttonSelected" : "")} onClick={() => window.PubSub.emit("onSectionChange", { name: name })}>
                <img className="navItem_icon" src={icon} alt="" />
            </button>
        );
    }
}
