import React, { Component } from "react";
import "../css/ItemSong.css";

import AlbumIcon from "../resources/albumSmall.svg";
import ArtistIcon from "../resources/artistSmall.svg";
import LikedIcon from "../resources/liked.svg";
import AddIcon from "../resources/add.svg";

export default class ItemSong extends Component {
    constructor(props) {
        super(props);

        this.info = {
            position: "normal", // "normal", "like", "add"
            thresholdSpeed: 10,
            acceleration: 0.1,

            // Top positions
            normalLeft: -9 * 16,
            addLeft: 0 * 16,
            likeLeft: -12 * 16
        };

        this.state = {
            left: this.info.normalLeft,
            originalLeftOffset: 0,
            speed: 0,
            timeOfLastDragEvent: 0,
            touchStartX: 0,
            touchStartY: 0,
            prevTouchX: 0,
            beingTouched: false,
            firstMove: false,
            correctScrollDirection: false,
            animationIntervalID: null
        };
    }
    // Handle the click on this item
    handleClick = (id, skeleton) => {
        if (!skeleton) window.PubSub.emit("onSongSelected", { id });
    };

    //##############################################
    //       SWIPE CONTROLS
    //##############################################

    // Snaps to the pos: "normal", "currentSongs", "miniature"
    snapToPosition() {
        let { left, speed, beingTouched, animationIntervalID } = this.state;
        const { position, acceleration, normalLeft, addLeft, likeLeft } = this.info;

        switch (position) {
            case "normal":
                // If coming from the left
                if (!beingTouched && left > normalLeft) {
                    speed -= 10 * acceleration;
                    left += speed;

                    // End animation
                    if (left <= normalLeft) {
                        window.clearInterval(animationIntervalID);
                        this.setState({ left: normalLeft, speed: 0, animationIntervalID: null, originalLeftOffset: 0 });
                    }

                    // Keep animating
                    else {
                        this.setState({ left, speed });
                    }
                }

                // If coming from the rioght
                else if (!beingTouched && left < normalLeft) {
                    speed += 10 * acceleration;
                    left += speed;

                    // End animation
                    if (left >= normalLeft) {
                        window.clearInterval(animationIntervalID);
                        this.setState({ left: normalLeft, speed: 0, animationIntervalID: null, originalLeftOffset: 0 });
                    }

                    // Keep animating
                    else {
                        this.setState({ left, speed });
                    }
                }

                // Interrupt animation
                else {
                    window.clearInterval(animationIntervalID);
                    this.setState({ left: normalLeft, speed: 0, animationIntervalID: null, originalLeftOffset: 0 });
                }
                break;
            case "like":
                // If coming from the left
                if (!beingTouched && left < likeLeft) {
                    speed -= 10 * acceleration;
                    left += speed;

                    if (left >= likeLeft) {
                        window.clearInterval(animationIntervalID);
                        this.setState({ left: likeLeft, speed: 0, animationIntervalID: null, originalLeftOffset: 0 });
                    }

                    // Keep animating
                    else {
                        this.setState({ left, speed });
                    }
                }

                // Interrupt animation
                else {
                    window.clearInterval(animationIntervalID);
                    this.setState({ left: likeLeft, speed: 0, animationIntervalID: null, originalLeftOffset: 0 });
                }
                break;
            case "add":
            default:
                // If coming from the right
                if (!beingTouched && left > addLeft) {
                    speed += 10 * acceleration;
                    left += speed;

                    // End animation
                    if (left <= addLeft) {
                        window.clearInterval(animationIntervalID);
                        this.setState({ left: addLeft, speed: 0, animationIntervalID: null, originalLeftOffset: 0 });
                    }

                    // Keep animating
                    else {
                        this.setState({ left, speed });
                    }
                }

                // Interrupt animation
                else {
                    window.clearInterval(animationIntervalID);
                    this.setState({ left: addLeft, speed: 0, animationIntervalID: null, originalLeftOffset: 0 });
                }
                break;
        }
    }

    // Called when the touch starts
    handleStart(event, clientX, clientY) {
        //event.preventDefault();
        const { left, animationIntervalID } = this.state;

        // Only engage when the user is scrolling horizontally
        console.log(event.targetTouches[0]);
        console.log("ClientX: ", clientX);
        console.log("ClientY: ", clientY);
        //if (Math.abs(clientX) < Math.abs(clientY)) return;

        if (animationIntervalID !== null) window.clearInterval(animationIntervalID);

        this.setState({
            originalLeftOffset: left,
            speed: 0,
            timeOfLastDragEvent: Date.now(),
            touchStartX: clientX,
            touchStartY: clientY,
            beingTouched: true,
            firstMove: true,
            animationIntervalID: null
        });
    }

    // Called when the touch moves
    handleMove(event, clientX, clientY) {
        const { beingTouched, firstMove, correctScrollDirection, timeOfLastDragEvent, prevTouchX, touchStartX, touchStartY, originalLeftOffset } = this.state;
        const { position, normalLeft, addLeft, likeLeft } = this.info;

        var deltaXMovement = clientX - touchStartX;
        var deltaYMovement = clientY - touchStartY;

        if (beingTouched) {
            // Vertical scrolling does not work when you start swiping horizontally.
            if (firstMove && Math.abs(deltaXMovement) > Math.abs(deltaYMovement)) {
                console.log("Canceeel");
                this.setState({ firstMove: false, correctScrollDirection: true });

                if (event.cancelable) {
                    event.preventDefault();
                    event.returnValue = false;
                } else {
                    this.handleEnd();
                    return;
                }
            } else if (!correctScrollDirection) {
                this.handleEnd();
                return;
            }

            const touchX = clientX;
            const currTime = Date.now();
            const deltaTime = currTime - timeOfLastDragEvent;
            const speed = (20 * (touchX - prevTouchX)) / deltaTime;
            let deltaX = touchX - touchStartX + originalLeftOffset;

            switch (position) {
                case "normal":
                    if (deltaX > addLeft) {
                        deltaX = addLeft;
                    } else if (deltaX < likeLeft) {
                        deltaX = likeLeft;
                    }
                    break;
                case "like":
                    if (deltaX < likeLeft) {
                        deltaX = likeLeft;
                    } else if (deltaX > normalLeft) {
                        deltaX = normalLeft;
                    }
                    break;
                case "add":
                default:
                    if (deltaX > addLeft) {
                        deltaX = addLeft;
                    } else if (deltaX < normalLeft) {
                        deltaX = normalLeft;
                    }
                    break;
            }

            this.setState({
                left: deltaX,
                speed: speed,
                timeOfLastDragEvent: currTime,
                prevTouchX: touchX
            });
        }
    }

    // Called when the touch ends
    handleEnd() {
        const { speed, left, beingTouched } = this.state;
        const { position, normalLeft, addLeft, likeLeft, thresholdSpeed } = this.info;

        if (beingTouched) {
            var newPos;
            switch (position) {
                case "normal":
                    if (speed < -thresholdSpeed && left <= normalLeft) newPos = "like";
                    else if (speed > thresholdSpeed) newPos = "add";
                    else {
                        if (left >= (normalLeft - addLeft) / 2) newPos = "add";
                        else if (left <= likeLeft + (normalLeft - likeLeft) / 2) newPos = "like";
                        else newPos = "normal";
                    }
                    break;
                case "like":
                    if (speed > thresholdSpeed) newPos = "normal";
                    else {
                        if (left <= likeLeft + (normalLeft - likeLeft) / 2) newPos = "like";
                        else newPos = "normal";
                    }
                    break;
                case "add":
                default:
                    if (speed < -thresholdSpeed) newPos = "normal";
                    else {
                        if (left >= (normalLeft - addLeft) / 2) newPos = "add";
                        else newPos = "normal";
                    }
                    break;
            }

            this.info.position = newPos;
            this.setState({
                speed: speed,
                touchStartX: 0,
                touchStartY: 0,
                beingTouched: false,
                firstMove: false,
                correctScrollDirection: false,
                animationIntervalID: window.setInterval(this.snapToPosition.bind(this), 15)
            });
        }
    }

    //##############################################
    //       REACT CICLE METHODS
    //##############################################

    // Renders the component
    render() {
        const { id, height, name, album, artist, selected, skeleton } = this.props;
        const { left } = this.state;

        //onTouchStart={event => this.handleStart(event, event.targetTouches[0].clientX, event.targetTouches[0].clientY)}
        //onTouchMove={event => this.handleMove(event.targetTouches[0].clientX, event.targetTouches[0].clientY)}
        //onTouchEnd={() => this.handleEnd()}
        return (
            <div
                className="itemSong_wrapper"
                ref={elem => (this.wrapperDOM = elem)}
                style={{ left: left + "px" }}
                onMouseDown={event => this.handleStart(event, event.clientX, event.clientY)}
                onMouseMove={event => this.handleMove(event, event.clientX, event.clientY)}
                onMouseUp={() => this.handleEnd()}
                onMouseLeave={() => this.handleEnd()}
            >
                <button className="itemSong_button" onClick={() => this.handleClick(id, skeleton)} style={{ height: height + "px" }}>
                    <p className={"itemSong_name " + (skeleton ? "itemSong_skeletonName" : "") + (selected ? " itemSong_selectedName" : "")}>{skeleton ? "-" : window.prettifyName(name)}</p>
                    <p className={"itemSong_info " + (skeleton ? "itemSong_skeletonInfo" : "")}>
                        {skeleton ? "-" : window.prettifyName(album)}
                        <strong> · </strong>
                        {window.prettifyName(artist)}
                    </p>
                </button>

                <button id={"itemSong_albumButton"} onClick={() => console.log("Album")}>
                    <img className="itemSong_icon" src={AlbumIcon} alt="" />
                </button>

                <button id={"itemSong_artistButton"} onClick={() => console.log("Artist")}>
                    <img className="itemSong_icon" src={ArtistIcon} alt="" />
                </button>

                <button id={"itemSong_addButton"} onClick={() => console.log("Add")}>
                    <img className="itemSong_icon" src={AddIcon} alt="" />
                </button>

                <button id={"itemSong_likedButton"} onClick={() => console.log("Liked")}>
                    <img className="itemSong_icon" src={LikedIcon} alt="" />
                </button>
            </div>
        );
    }

    // Called when the component mounts
    componentDidMount() {
        this.wrapperDOM.addEventListener("touchstart", event => this.handleStart(event, event.targetTouches[0].clientX, event.targetTouches[0].clientY));
        this.wrapperDOM.addEventListener("touchmove", event => this.handleMove(event, event.targetTouches[0].clientX, event.targetTouches[0].clientY), { passive: false });
        this.wrapperDOM.addEventListener("touchend", () => this.handleEnd());
    }

    // Called when the component unmounts
    componentWillUnmount() {
        this.wrapperDOM.removeEventListener("touchstart", event => this.handleStart(event, event.targetTouches[0].clientX, event.targetTouches[0].clientY));
        this.wrapperDOM.removeEventListener("touchmove", event => this.handleMove(event, event.targetTouches[0].clientX, event.targetTouches[0].clientY), { passive: false });
        this.wrapperDOM.removeEventListener("touchend", () => this.handleEnd());
    }

    preventTouch(e) {
        const minValue = 5; // threshold

        this.clientX = e.touches[0].clientX - this.firstClientX;
        this.clientY = e.touches[0].clientY - this.firstClientY;

        // Vertical scrolling does not work when you start swiping horizontally.
        if (Math.abs(this.clientX) > minValue) {
            e.preventDefault();
            e.returnValue = false;
            return false;
        }
    }
}
