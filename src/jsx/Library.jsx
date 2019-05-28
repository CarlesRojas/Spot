import React, { Component } from "react";
import SlideTransition from "./SlideTransition";
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
            sections: [
                {
                    name: "song",
                    icon: SongIcon,
                    index: 0
                },
                {
                    name: "album",
                    icon: AlbumIcon,
                    index: 1
                },
                {
                    name: "artist",
                    icon: ArtistIcon,
                    index: 2
                },
                {
                    name: "playlist",
                    icon: PlaylistIcon,
                    index: 3
                },
                {
                    name: "search",
                    icon: SearchIcon,
                    index: 4
                }
            ],
            prevSectionName: null,
            prevSectionIndex: null,
            currSectionName: "song",
            currSectionIndex: 0
        };

        this.noTransitionOnFirstLoad = 2;

        // Sub to events when this component is mounted
        window.PubSub.sub("onSectionChange", this.handleSectionChange);
    }

    // Handle the click to a new section
    handleSectionChange = ({ name, index }) => {
        this.setState(prevState => {
            if (prevState.currSectionName === name) return;
            else
                return {
                    prevSectionName: prevState.currSectionName,
                    prevSectionIndex: prevState.currSectionIndex,
                    currSectionName: name,
                    currSectionIndex: index
                };
        });
    };

    // Returns the name & index of the section
    getSectionIndex = sectionName => {
        for (var i = 0; i < this.state.sections.length; ++i) {
            if (this.state.sections[i].name === sectionName) return { sectionName: sectionName, sectionIndex: i };
        }
        return { sectionName: this.state.sections[0].name, sectionIndex: 0 };
    };

    render() {
        const { playbackState } = this.props;
        const { prevSectionIndex, currSectionName, currSectionIndex } = this.state;
        const leftToRight = prevSectionIndex < currSectionIndex;

        // Only play the animation after the first loading
        const duration = this.noTransitionOnFirstLoad ? 0 : 100;
        if (this.noTransitionOnFirstLoad) --this.noTransitionOnFirstLoad;

        return (
            <React.Fragment>
                <div className="sections_wrapper">
                    <SlideTransition isOpen={currSectionName === "song"} duration={duration} moveLeftToRight={leftToRight}>
                        <div className="section_wrapper">
                            <Songs type="songs" playbackState={playbackState} />
                        </div>
                    </SlideTransition>

                    <SlideTransition isOpen={currSectionName === "album"} duration={duration} moveLeftToRight={leftToRight}>
                        <div className="section_wrapper">
                            <Albums />
                        </div>
                    </SlideTransition>

                    <SlideTransition isOpen={currSectionName === "artist"} duration={duration} moveLeftToRight={leftToRight}>
                        <div className="section_wrapper">
                            <Artists />
                        </div>
                    </SlideTransition>

                    <SlideTransition isOpen={currSectionName === "playlist"} duration={duration} moveLeftToRight={leftToRight}>
                        <div className="section_wrapper">
                            <Playlists />
                        </div>
                    </SlideTransition>

                    <SlideTransition isOpen={currSectionName === "search"} duration={duration} moveLeftToRight={leftToRight}>
                        <div className="section_wrapper">
                            <Search />
                        </div>
                    </SlideTransition>
                </div>

                <div className="navBar_bar">
                    {this.state.sections.map(section => (
                        <NavItem key={section.name} name={section.name} icon={section.icon} index={section.index} selected={section.name === this.state.currSectionName} />
                    ))}
                </div>
            </React.Fragment>
        );
    }

    // Unsub from events when this component gets unmounted
    componentWillUnmount() {
        window.PubSub.unsub("onSectionChange", this.handleSectionChange);
    }
}

class NavItem extends Component {
    render() {
        const { name, icon, index, selected } = this.props;
        return (
            <button
                className={"navBar_button" + (selected ? " navBar_buttonSelected" : "")}
                onClick={() => window.PubSub.emit("onSectionChange", { name: name, index: index })}
            >
                <img className="navBar_icon" src={icon} alt="" />
            </button>
        );
    }
}
