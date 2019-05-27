import React, { Component } from "react";
//import Swipe from "react-easy-swipe";
import "../css/Cover.css";

export default class Cover extends Component {
    constructor(props) {
        super(props);

        const { width } = this.props;

        this.state = {
            mesurements: this.getMesurements(width)
        };
    }

    getMesurements = width => {
        return {
            size: (width / 100) * 95,
            closed_size: (width / 100) * 20,
            margin: (width / 100) * 2.5,
            radius: (width / 100) * 5
        };
    };

    handleCoverClick = () => {
        window.PubSub.emit("onPausePlay");

        console.log("click");
        /*
        const { mesurements } = this.state;
        const { closed_size } = mesurements;
        this.wrapperDOM.style.height = closed_size + "px";
        */
    };

    render() {
        const { mesurements } = this.state;
        const { size, margin, radius, closed_size } = mesurements;
        const { open, playing, song, albumCover, artist } = this.props;

        var squareStyle = {
            width: size + "px",
            height: open ? size + "px" : closed_size + "px"
        };

        var squareMargin = {
            width: size + "px",
            height: open ? size + "px" : closed_size + "px",
            margin: margin + "px"
        };

        var infoStyle = {
            width: size + "px",
            height: closed_size + "px",
            bottom: margin + "px"
        };

        // Place the play icon
        if (playing) var playIcon = null;
        else playIcon = <img className="cover_play" src="https://i.imgur.com/e19q8bV.png" alt="" style={squareStyle} />;

        return (
            <div style={squareMargin} ref={elem => (this.wrapperDOM = elem)}>
                <svg className="cover_clip" style={squareStyle}>
                    <defs>
                        <clipPath id="cover_clipPath">
                            <circle id="cover_clip_circle_tl" cx={radius + "px"} cy={radius + "px"} r={radius + "px"} />
                            <circle id="cover_clip_circle_tr" cx={"calc(" + size + "px - " + radius + ")"} cy={radius + "px"} r={radius + "px"} />
                            <circle id="cover_clip_circle_bl" cx={radius + "px"} cy={"calc(" + size + "px - " + radius + ")"} r={radius + "px"} />
                            <circle id="cover_clip_circle_br" cx={"calc(" + size + "px - " + radius + ")"} cy={"calc(" + size + "px - " + radius + ")"} r={radius + "px"} />
                            <rect id="cover_clip_rect_h" x="0" y={radius + "px"} width={size + "px"} height={"calc(" + size + "px - " + radius * 2 + "px)"} />
                            <rect id="cover_clip_rect_v" x={radius + "px"} y="0" width={"calc(" + size + "px - " + radius * 2 + "px)"} height={size + "px"} />
                        </clipPath>
                    </defs>
                </svg>

                <div className="cover_wrapper">
                    <img className={"cover_image" + (playing ? "" : " cover_imagePaused")} src={albumCover} onClick={() => this.handleCoverClick()} style={squareStyle} alt="" />
                    <div id="cover_titleGradient" style={squareStyle} />
                    <div id="cover_timeGradient" style={squareStyle} />
                    <div className="cover_infoWrapper" style={infoStyle}>
                        <p className="cover_song" style={{ padding: "0 " + margin * 2 + "px" }}>
                            {song}
                        </p>
                        <p className="cover_artist" style={{ padding: "0 " + margin * 2 + "px" }}>
                            {artist}
                        </p>
                    </div>
                    {playIcon}
                </div>
            </div>
        );
    }
}
