import React, { Component } from "react";
import { sortableHandle } from "react-sortable-hoc";
import "../css/ItemSong.css";

import AlbumIcon from "../resources/albumSmall.svg";
import ArtistIcon from "../resources/artistSmall.svg";
import LikedIcon from "../resources/liked.svg";
import AddIcon from "../resources/add.svg";
import SortIcon from "../resources/hamburger.svg";
import RemoveIcon from "../resources/remove.svg";

const DragHandle = sortableHandle(({ index, left, value }) => {
    var style = left ? { width: "2rem", height: "calc(100% - 1rem)", left: value } : { width: "2rem", height: "calc(100% - 1rem)", right: value };

    return (
        <div key={index} className="itemSong_actionButton" style={style}>
            <img className="itemSong_icon" src={SortIcon} alt="" />
        </div>
    );
});

export default class ItemSong extends Component {
    constructor(props) {
        super(props);

        const { actions } = props;

        var hiddenLeftIcons = actions.left.list.length - actions.left.numberOfActionsAlwaysVisible;
        var hiddenRightIcons = actions.right.list.length - actions.right.numberOfActionsAlwaysVisible;
        var containerWidth = window.innerWidth - 7; // 7 pixels is the width of the scrollbar

        this.info = {
            position: "normal", // "normal", "left", "right"
            thresholdSpeed: 10,
            acceleration: 0.1,

            // Dimensions and static positions
            width: containerWidth + (hiddenLeftIcons + hiddenRightIcons) * 3 * 16, // 3 rems
            nameWidth: containerWidth - (actions.left.numberOfActionsAlwaysVisible + actions.right.numberOfActionsAlwaysVisible) * 3 * 16 - 1.5 * 16, // 1.5 is the margin of the list
            nameLeftOffset: actions.left.list.length * 3 * 16,

            // Left positions
            leftLeft: 0 * 16, // 0.75 * 16 is the size of the margin of the list
            normalLeft: hiddenLeftIcons * -3 * 16,
            rightLeft: (hiddenLeftIcons + hiddenRightIcons) * -3 * 16
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

    // Handle the click on an action
    handleActionClick = (id, event) => {
        const { onDelete } = this.props;

        // Open the add to popup
        if (event === "onAddToClicked") {
            window.PubSub.emit(event, { ids: [id] });
            return;
        }

        // Delete from the list if unliked
        if (event === "onSongLikeClicked") onDelete();

        window.PubSub.emit(event, { id });
    };

    // Handle the actions having to close
    handleCloseSongActions = id => {
        const { position } = this.info;

        if (id && id === this.props.id) return;

        window.PubSub.unsub("onCloseSongActions", this.handleCloseSongActions);
        this.info.position = "normal";
        this.setState({
            speed: position === "left" ? -10 : 10,
            touchStartX: 0,
            touchStartY: 0,
            beingTouched: false,
            firstMove: false,
            correctScrollDirection: false,
            animationIntervalID: window.setInterval(this.snapToPosition.bind(this), 15)
        });
    };

    // Handle the song being eliminated from the list
    handleDeleteSong = () => {};

    //##############################################
    //       SWIPE CONTROLS
    //##############################################

    // Snaps to the pos: "normal", "currentSongs", "miniature"
    snapToPosition() {
        let { left, speed, beingTouched, animationIntervalID } = this.state;
        const { position, acceleration, normalLeft, leftLeft, rightLeft } = this.info;

        switch (position) {
            case "normal":
                // If coming from the left
                if (!beingTouched && left > normalLeft) {
                    speed -= 10 * acceleration;
                    left += speed;

                    // End animation
                    if (left <= normalLeft) {
                        window.clearInterval(animationIntervalID);
                        this.setState({
                            left: normalLeft,
                            speed: 0,
                            animationIntervalID: null,
                            originalLeftOffset: 0
                        });
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
                        this.setState({
                            left: normalLeft,
                            speed: 0,
                            animationIntervalID: null,
                            originalLeftOffset: 0
                        });
                    }

                    // Keep animating
                    else {
                        this.setState({ left, speed });
                    }
                }

                // Interrupt animation
                else {
                    window.clearInterval(animationIntervalID);
                    this.setState({
                        left: normalLeft,
                        speed: 0,
                        animationIntervalID: null,
                        originalLeftOffset: 0
                    });
                }
                break;
            case "right":
                // If coming from the left
                if (!beingTouched && left < rightLeft) {
                    speed -= 10 * acceleration;
                    left += speed;

                    if (left >= rightLeft) {
                        window.clearInterval(animationIntervalID);
                        this.setState({
                            left: rightLeft,
                            speed: 0,
                            animationIntervalID: null,
                            originalLeftOffset: 0
                        });
                    }

                    // Keep animating
                    else {
                        this.setState({ left, speed });
                    }
                }

                // Interrupt animation
                else {
                    window.clearInterval(animationIntervalID);
                    this.setState({
                        left: rightLeft,
                        speed: 0,
                        animationIntervalID: null,
                        originalLeftOffset: 0
                    });
                }
                break;
            case "left":
            default:
                // If coming from the right
                if (!beingTouched && left > leftLeft) {
                    speed += 10 * acceleration;
                    left += speed;

                    // End animation
                    if (left <= leftLeft) {
                        window.clearInterval(animationIntervalID);
                        this.setState({
                            left: leftLeft,
                            speed: 0,
                            animationIntervalID: null,
                            originalLeftOffset: 0
                        });
                    }

                    // Keep animating
                    else {
                        this.setState({ left, speed });
                    }
                }

                // Interrupt animation
                else {
                    window.clearInterval(animationIntervalID);
                    this.setState({
                        left: leftLeft,
                        speed: 0,
                        animationIntervalID: null,
                        originalLeftOffset: 0
                    });
                }
                break;
        }
    }

    // Called when the touch starts
    handleStart(event, clientX, clientY) {
        const { left, animationIntervalID } = this.state;

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
        const {
            beingTouched,
            firstMove,
            correctScrollDirection,
            timeOfLastDragEvent,
            prevTouchX,
            touchStartX,
            touchStartY,
            originalLeftOffset
        } = this.state;
        const { position, normalLeft, leftLeft, rightLeft } = this.info;

        var deltaXMovement = clientX - touchStartX;
        var deltaYMovement = clientY - touchStartY;

        if (beingTouched) {
            // If it is the first move and has the correct scrolling direction, prevent default scroll
            if (firstMove && Math.abs(deltaXMovement) > Math.abs(deltaYMovement)) {
                this.setState({ firstMove: false, correctScrollDirection: true });

                // If the normal scroll is not running, prevent it
                if (event.cancelable) {
                    event.preventDefault();
                    event.returnValue = false;
                }

                // If the normal scroll is already runningm cancel this touch
                else {
                    this.handleEnd();
                    return;
                }
            }

            // If its not the first move, and have a bad scrolling direction, end this touch
            else if (!correctScrollDirection) {
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
                    if (deltaX > leftLeft) {
                        deltaX = leftLeft;
                    } else if (deltaX < rightLeft) {
                        deltaX = rightLeft;
                    }
                    break;
                case "right":
                    if (deltaX < rightLeft) {
                        deltaX = rightLeft;
                    } else if (deltaX > normalLeft) {
                        deltaX = normalLeft;
                    }
                    break;
                case "left":
                default:
                    if (deltaX > leftLeft) {
                        deltaX = leftLeft;
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
        const { id, actions } = this.props;
        const { speed, left, beingTouched } = this.state;
        const { position, normalLeft, leftLeft, rightLeft, thresholdSpeed } = this.info;

        var hiddenLeftIcons = actions.left.list.length - actions.left.numberOfActionsAlwaysVisible;
        var hiddenRightIcons = actions.right.list.length - actions.right.numberOfActionsAlwaysVisible;

        if (beingTouched) {
            var newPos;
            switch (position) {
                case "normal":
                    if (speed < -thresholdSpeed && left <= normalLeft) newPos = hiddenRightIcons > 0 ? "right" : "normal";
                    else if (speed > thresholdSpeed) newPos = hiddenLeftIcons > 0 ? "left" : "normal";
                    else {
                        if (left >= (normalLeft - leftLeft) / 2) newPos = hiddenLeftIcons > 0 ? "left" : "normal";
                        else if (left <= rightLeft + (normalLeft - rightLeft) / 2) newPos = hiddenRightIcons > 0 ? "right" : "normal";
                        else newPos = "normal";
                    }
                    break;
                case "right":
                    if (speed > thresholdSpeed) newPos = "normal";
                    else {
                        if (left <= rightLeft + (normalLeft - rightLeft) / 2) newPos = "right";
                        else newPos = "normal";
                    }
                    break;
                case "left":
                default:
                    if (speed < -thresholdSpeed) newPos = "normal";
                    else {
                        if (left >= (normalLeft - leftLeft) / 2) newPos = "left";
                        else newPos = "normal";
                    }
                    break;
            }

            if (newPos === "left" || newPos === "right") {
                window.PubSub.emit("onCloseSongActions", id);
                window.PubSub.sub("onCloseSongActions", this.handleCloseSongActions);
            } else window.PubSub.unsub("onCloseSongActions", this.handleCloseSongActions);

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
        const { id, height, name, album, artist, selected, skeleton, albumID, artistID, actions } = this.props;
        const { width, nameWidth, nameLeftOffset } = this.info;
        const { left } = this.state;

        // Compute left buttons
        var leftButtons = actions.left.list.map(({ event, type }, index) => {
            // Special case for the draggable sort icon
            if (type === "sort") return <DragHandle key={index} index={index} left={true} value={index * 3 * 16 - 0.75 * 16 + "px"} />; // 3 * 16 are 3 rems, 0.75 * 16 is the margin

            if (type === "album") {
                var icon = AlbumIcon;
                var importantID = albumID;
            } else if (type === "artist") {
                icon = ArtistIcon;
                importantID = artistID;
            } else if (type === "add") {
                icon = AddIcon;
                importantID = id;
            } else if (type === "remove") {
                icon = RemoveIcon;
                importantID = id;
            } else if (type === "like") {
                icon = LikedIcon;
                importantID = id;
            }
            return (
                <button
                    key={index}
                    className="itemSong_actionButton"
                    onClick={() => this.handleActionClick(importantID, event)}
                    style={{ left: index * 3 * 16 - 0.75 * 16 + "px" }}
                >
                    <img className="itemSong_icon" src={icon} alt="" />
                </button>
            );
        });

        var rightButtons = actions.right.list.map(({ event, type }, index) => {
            // Special case for the draggable sort icon
            if (type === "sort") return <DragHandle key={index} index={index} left={false} value={index * 3 * 16 + 0.75 * 16 + "px"} />;

            if (type === "album") {
                var icon = AlbumIcon;
                var importantID = albumID;
            } else if (type === "artist") {
                icon = ArtistIcon;
                importantID = artistID;
            } else if (type === "add") {
                icon = AddIcon;
                importantID = id;
            } else if (type === "remove") {
                icon = RemoveIcon;
                importantID = id;
            } else if (type === "like") {
                icon = LikedIcon;
                importantID = id;
            }

            return (
                <button
                    key={index}
                    className="itemSong_actionButton"
                    onClick={() => this.handleActionClick(importantID, event)}
                    style={{ right: index * 3 * 16 + 0.75 * 16 + "px" }}
                >
                    <img className="itemSong_icon" src={icon} alt="" />
                </button>
            );
        });

        return (
            <div className="itemSong_wrapper" ref={elem => (this.wrapperDOM = elem)} style={{ left: left + "px", width: width + "px" }}>
                <button
                    className="itemSong_button"
                    onClick={() => this.handleClick(id, skeleton)}
                    style={{ height: height + "px", width: nameWidth, left: nameLeftOffset + "px" }}
                >
                    <p className={"itemSong_name " + (skeleton ? "itemSong_skeletonName" : "") + (selected ? " itemSong_selectedName" : "")}>
                        {skeleton ? "-" : window.prettifyName(name)}
                    </p>
                    <p className={"itemSong_info " + (skeleton ? "itemSong_skeletonInfo" : "")}>
                        {skeleton ? "-" : window.prettifyName(album)}
                        <strong> · </strong>
                        {window.prettifyName(artist)}
                    </p>
                </button>

                {leftButtons}
                {rightButtons}
            </div>
        );
    }

    // Called when the component mounts
    componentDidMount() {
        this.wrapperDOM.addEventListener("touchstart", event =>
            this.handleStart(event, event.targetTouches[0].clientX, event.targetTouches[0].clientY)
        );
        this.wrapperDOM.addEventListener(
            "touchmove",
            event => this.handleMove(event, event.targetTouches[0].clientX, event.targetTouches[0].clientY),
            { passive: false }
        );
        this.wrapperDOM.addEventListener("touchend", () => this.handleEnd());
    }

    // Called when the component unmounts
    componentWillUnmount() {
        let { animationIntervalID } = this.state;

        this.wrapperDOM.removeEventListener("touchstart", event =>
            this.handleStart(event, event.targetTouches[0].clientX, event.targetTouches[0].clientY)
        );
        this.wrapperDOM.removeEventListener(
            "touchmove",
            event => this.handleMove(event, event.targetTouches[0].clientX, event.targetTouches[0].clientY),
            { passive: false }
        );
        this.wrapperDOM.removeEventListener("touchend", () => this.handleEnd());
        window.PubSub.unsub("onCloseSongActions", this.handleCloseSongActions);
        window.clearInterval(animationIntervalID);
    }
}
