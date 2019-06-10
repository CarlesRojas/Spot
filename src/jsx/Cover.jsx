import React, { Component } from "react";
import FadeTransition from "./FadeTransition";
//import Swipe from "react-easy-swipe";
import "../css/Cover.css";

export default class Cover extends Component {
    constructor(props) {
        super(props);

        this.info = {
            position: "normal", // "normal", "currentSongs", "miniature"
            thresholdSpeed: 10,
            acceleration: 0.1,

            // Heights
            normalHeight: window.innerWidth,
            smallHeight: window.innerWidth / 3.5,

            // Top positions
            normalTop: window.innerHeight - window.innerWidth,
            currentSongsTop: 0,
            miniatureTop: window.innerHeight - window.innerWidth / 3.5
        };

        this.state = {
            height: this.info.normalHeight,
            top: this.info.normalTop,
            originalTopOffset: 0,
            speed: 0,
            timeOfLastDragEvent: 0,
            touchStartY: 0,
            prevTouchY: 0,
            beingTouched: false,
            animationIntervalID: null
        };

        window.PubSub.emit("onVerticalSwipe", {
            normalHeight: this.info.normalHeight,
            smallHeigth: this.info.smallHeight,
            normalTop: this.info.normalTop,
            miniatureTop: this.info.miniatureTop,
            currentSongsTop: this.info.currentSongsTop,
            currentHeight: this.info.normalHeight,
            currentTop: this.info.normalTop
        });
    }

    handleCoverClick = () => {
        window.PubSub.emit("onPausePlay");
    };

    //##############################################
    //       SWIPE CONTROLS
    //##############################################

    // Snaps to the pos: "normal", "currentSongs", "miniature"
    snapToPosition() {
        let { height, top, speed, beingTouched, animationIntervalID } = this.state;
        const { position, acceleration, normalHeight, smallHeight, normalTop, miniatureTop, currentSongsTop } = this.info;

        // Emit info about the current position
        function emitInfo(height, top, info) {
            window.PubSub.emit("onVerticalSwipe", {
                normalHeight: info.normalHeight,
                smallHeigth: info.smallHeight,
                normalTop: info.normalTop,
                miniatureTop: info.miniatureTop,
                currentSongsTop: info.currentSongsTop,
                currentHeight: height,
                currentTop: top
            });
        }

        switch (position) {
            case "normal":
                // If coming from the top
                if (!beingTouched && top < normalTop) {
                    console.log("FromTop");
                    speed += 10 * acceleration;

                    if (height < normalHeight) {
                        height += speed;
                        if (height > normalHeight) {
                            top += height - normalHeight;
                            height = normalHeight;
                        }
                    } else top += speed;

                    // End animation
                    if (top >= normalTop) {
                        window.clearInterval(animationIntervalID);
                        emitInfo(normalHeight, normalTop, this.info);
                        this.setState({ height: normalHeight, top: normalTop, speed: 0, animationIntervalID: null, originalTopOffset: 0 });
                    }

                    // Kepp animating
                    else {
                        emitInfo(height, top, this.info);
                        this.setState({ height, top, speed });
                    }
                }

                // If coming from below
                else if (!beingTouched && top > normalTop) {
                    console.log("FromBot");
                    speed -= 10 * acceleration;

                    top += speed;
                    height = Math.min(height - speed, normalHeight);

                    if (top <= normalTop) {
                        // End animation
                        window.clearInterval(animationIntervalID);
                        emitInfo(normalHeight, normalTop, this.info);
                        this.setState({ height: normalHeight, top: normalTop, speed: 0, animationIntervalID: null, originalTopOffset: 0 });
                    }

                    // Kepp animating
                    else {
                        emitInfo(height, top, this.info);
                        this.setState({ height, top, speed });
                    }
                }

                // Interrupt animation
                else {
                    window.clearInterval(animationIntervalID);
                    emitInfo(normalHeight, normalTop, this.info);
                    this.setState({ height: normalHeight, top: normalTop, speed: 0, animationIntervalID: null, originalTopOffset: 0 });
                }
                break;
            case "currentSongs":
                // If coming from below
                if (!beingTouched && (top > currentSongsTop || height > smallHeight)) {
                    speed -= 10 * acceleration;

                    if (top > currentSongsTop) {
                        top += speed;
                        if (top < currentSongsTop) {
                            height -= top - currentSongsTop;
                            top = currentSongsTop;
                        }
                    } else if (height > smallHeight) {
                        height += speed;
                        if (height < smallHeight) height = smallHeight;
                    }

                    if (top === currentSongsTop && height === smallHeight) {
                        window.clearInterval(animationIntervalID);
                        emitInfo(smallHeight, currentSongsTop, this.info);
                        this.setState({ height: smallHeight, top: currentSongsTop, speed: 0, animationIntervalID: null, originalTopOffset: 0 });
                    }

                    // Kepp animating
                    else {
                        emitInfo(height, top, this.info);
                        this.setState({ height, top, speed });
                    }
                }

                // Interrupt animation
                else {
                    window.clearInterval(animationIntervalID);
                    emitInfo(smallHeight, currentSongsTop, this.info);
                    this.setState({ height: smallHeight, top: currentSongsTop, speed: 0, animationIntervalID: null, originalTopOffset: 0 });
                }
                break;
            case "miniature":
            default:
                // If coming from the top
                if (!beingTouched && top < miniatureTop) {
                    speed += 10 * acceleration;
                    top += speed;
                    height = Math.max(height - speed, smallHeight);

                    // End animation
                    if (top >= miniatureTop) {
                        window.clearInterval(animationIntervalID);
                        emitInfo(smallHeight, miniatureTop, this.info);
                        this.setState({ height: smallHeight, top: miniatureTop, speed: 0, animationIntervalID: null, originalTopOffset: 0 });
                    }

                    // Kepp animating
                    else {
                        emitInfo(height, top, this.info);
                        this.setState({ height, top, speed });
                    }
                }

                // Interrupt animation
                else {
                    window.clearInterval(animationIntervalID);
                    emitInfo(smallHeight, miniatureTop, this.info);
                    this.setState({ height: smallHeight, top: miniatureTop, speed: 0, animationIntervalID: null, originalTopOffset: 0 });
                }
                break;
        }
    }

    // Called when the touch starts
    handleStart(event, clientX, clientY) {
        //event.preventDefault();
        const { top, animationIntervalID } = this.state;

        if (animationIntervalID !== null) window.clearInterval(animationIntervalID);

        this.setState({
            originalTopOffset: top,
            speed: 0,
            timeOfLastDragEvent: Date.now(),
            touchStartY: clientY,
            beingTouched: true,
            animationIntervalID: null
        });
    }

    // Called when the touch moves
    handleMove(clientX, clientY) {
        const { beingTouched, timeOfLastDragEvent, prevTouchY, touchStartY, originalTopOffset } = this.state;
        const { position, normalHeight, smallHeight, normalTop, miniatureTop, currentSongsTop } = this.info;

        if (beingTouched) {
            const touchY = clientY;
            const currTime = Date.now();
            const deltaTime = currTime - timeOfLastDragEvent;
            const speed = (20 * (touchY - prevTouchY)) / deltaTime;
            let deltaY = touchY - touchStartY + originalTopOffset;

            var height;
            switch (position) {
                case "normal":
                    if (deltaY < currentSongsTop) {
                        height = Math.max(normalHeight - Math.abs(deltaY - currentSongsTop), smallHeight);
                        deltaY = currentSongsTop;
                    } else if (deltaY > miniatureTop) {
                        height = smallHeight;
                        deltaY = miniatureTop;
                    } else if (deltaY > normalTop) {
                        height = Math.max(normalHeight - Math.abs(deltaY - normalTop), smallHeight);
                    } else {
                        height = normalHeight;
                    }
                    break;
                case "currentSongs":
                    if (deltaY < currentSongsTop) {
                        height = smallHeight;
                        deltaY = currentSongsTop;
                    } else if (deltaY > normalTop + (normalHeight - smallHeight)) {
                        height = normalHeight;
                        deltaY = normalTop;
                    } else {
                        height = smallHeight + Math.abs(deltaY - currentSongsTop);
                        deltaY = currentSongsTop;
                        if (height > normalHeight) {
                            deltaY = Math.abs(height - normalHeight);
                            height = normalHeight;
                        }
                    }
                    break;
                case "miniature":
                default:
                    if (deltaY < normalTop) {
                        height = normalHeight;
                        deltaY = normalTop;
                    } else if (deltaY > miniatureTop) {
                        height = smallHeight;
                        deltaY = miniatureTop;
                    } else {
                        height = Math.min(smallHeight + Math.abs(deltaY - miniatureTop), normalHeight);
                    }
                    break;
            }

            window.PubSub.emit("onVerticalSwipe", {
                normalHeight: this.info.normalHeight,
                smallHeigth: this.info.smallHeight,
                normalTop: this.info.normalTop,
                miniatureTop: this.info.miniatureTop,
                currentSongsTop: this.info.currentSongsTop,
                currentHeight: height,
                currentTop: deltaY
            });

            this.setState({
                top: deltaY,
                height: height,
                speed: speed,
                timeOfLastDragEvent: currTime,
                prevTouchY: touchY
            });
        }
    }

    // Called when the touch ends
    handleEnd() {
        const { speed, height, top } = this.state;
        const { position, normalTop, miniatureTop, thresholdSpeed } = this.info;

        var newPos;
        switch (position) {
            case "normal":
                if (speed > thresholdSpeed && top >= normalTop) newPos = "miniature";
                else if (speed < -thresholdSpeed) newPos = "currentSongs";
                else {
                    if (top <= 0) newPos = "currentSongs";
                    else if (top > normalTop && top - normalTop > (miniatureTop - normalTop) / 2) newPos = "miniature";
                    else newPos = "normal";
                }
                break;
            case "currentSongs":
                if (speed > thresholdSpeed) newPos = "normal";
                else {
                    if (top <= 0) newPos = "currentSongs";
                    else newPos = "normal";
                }
                break;
            case "miniature":
            default:
                if (speed < -thresholdSpeed) newPos = "normal";
                else {
                    if (top - normalTop > (miniatureTop - normalTop) / 2) newPos = "miniature";
                    else newPos = "normal";
                }
                break;
        }

        window.PubSub.emit("onVerticalSwipe", {
            normalHeight: this.info.normalHeight,
            smallHeigth: this.info.smallHeight,
            normalTop: this.info.normalTop,
            miniatureTop: this.info.miniatureTop,
            currentSongsTop: this.info.currentSongsTop,
            currentHeight: height,
            currentTop: top
        });

        this.info.position = newPos;
        this.setState({
            speed: speed,
            touchStartY: 0,
            beingTouched: false,
            animationIntervalID: window.setInterval(this.snapToPosition.bind(this), 15)
        });
    }

    render() {
        const { playing, song, albumCover, artist } = this.props;
        const { height, top } = this.state;
        const { normalHeight, smallHeight } = this.info;
        const width = (window.innerWidth / 100) * 95;
        const radius = (window.innerWidth / 100) * 4;
        const margin = (window.innerWidth / 100) * 5;
        const coverHeight = height - margin;
        const imageTop = margin / 2 - (width - coverHeight) / 2;

        return (
            <div
                className="cover_wrapper"
                style={{ height: height + "px", top: top + "px" }}
                onTouchStart={event => this.handleStart(event, event.targetTouches[0].clientX, event.targetTouches[0].clientY)}
                onTouchMove={event => this.handleMove(event.targetTouches[0].clientX, event.targetTouches[0].clientY)}
                onTouchEnd={() => this.handleEnd()}
                onMouseDown={event => this.handleStart(event, event.clientX, event.clientY)}
                onMouseMove={event => this.handleMove(event.clientX, event.clientY)}
                onMouseUp={() => this.handleEnd()}
                onMouseLeave={() => this.handleEnd()}
            >
                <svg className="cover_clip">
                    <defs>
                        <clipPath id="cover_clipPath">
                            <circle id="cover_clip_circle_tl" cx={radius + "px"} cy={radius + "px"} r={radius + "px"} />
                            <circle id="cover_clip_circle_tr" cx={"calc(" + width + "px - " + radius + ")"} cy={radius + "px"} r={radius + "px"} />
                            <circle id="cover_clip_circle_bl" cx={radius + "px"} cy={"calc(" + coverHeight + "px - " + radius + ")"} r={radius + "px"} />
                            <circle
                                id="cover_clip_circle_br"
                                cx={"calc(" + width + "px - " + radius + ")"}
                                cy={"calc(" + coverHeight + "px - " + radius + ")"}
                                r={radius + "px"}
                            />
                            <rect id="cover_clip_rect_h" x="0" y={radius + "px"} width={width + "px"} height={"calc(" + coverHeight + "px - " + radius * 2 + "px)"} />
                            <rect id="cover_clip_rect_v" x={radius + "px"} y="0" width={"calc(" + width + "px - " + radius * 2 + "px)"} height={coverHeight + "px"} />
                        </clipPath>
                    </defs>
                </svg>

                <div className="cover_art" style={{ height: coverHeight + "px", margin: margin / 2 + "px" }}>
                    <img
                        className={"cover_image" + (playing ? "" : " cover_imagePaused")}
                        src={albumCover}
                        onClick={() => this.handleCoverClick()}
                        alt=""
                        style={{ top: imageTop + "px" }}
                    />
                    <div id="cover_titleGradient" style={{ height: normalHeight - margin + "px", bottom: margin / 2 + "px" }} />
                    <div id="cover_timeGradient" style={{ height: coverHeight + "px" }} />
                    <div className="cover_infoWrapper" style={{ height: smallHeight * 0.95 + "px" }}>
                        <p className="cover_song">{song}</p>
                        <p className="cover_artist">{artist}</p>
                    </div>
                    <FadeTransition extraStyle={{ height: coverHeight + "px", width: width + "px", bottom: margin / 2 + "px" }} isOpen={!playing} duration={100}>
                        <div className="cover_playWrapper">
                            <img className="cover_play" src="https://i.imgur.com/Ehaofzy.png" alt="" />
                        </div>
                    </FadeTransition>
                </div>
            </div>
        );
    }
}
