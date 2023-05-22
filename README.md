 # Connect Four Intelligence Game


**Connect Four is an online intelligence game for two players, developed with Vue Js.**

![connect four](https://user-images.githubusercontent.com/25087769/78579093-19d3c780-7839-11ea-8c0f-b89b60e39aea.PNG)


## Introduction
* Initially sold under the Connect Four (Four-In-A-Row) trademark by Milton Bradley in 1974.
* Versions of different dimensions exist.
* This game is developed according to a 6 X 8 version.
* It's a two-player intelligence game.


## Goal
* The aim is to line up your 4 pieces consecutively horizontally, vertically, or diagonally.
 
## Features
* Player colors consist of two colors, red and green.
* The player who first enters the game is defined as red, the other player is defined as green.
* The game board is a 6 X 8 board with 6 rows and 8 columns.
* The total number of possible moves is 6 X 8 = 48.

## How to Play ?
* In the moves made, the stones are dropped into the column selected from the game board.
* The stones fall to the lowest row they can descend from the column. With such moves made, the rows and columns start to fill from bottom to top.

![connect four](https://user-images.githubusercontent.com/25087769/78575291-d3c83500-7833-11ea-8450-a1475eb6ab98.gif)


## How to Win ?
* The first player who brings 4 stones of the same color horizontally, vertically, or diagonally in a row wins the game.
* Each won game earns the player 10 points.
* If all stones are placed but the players could not consecutively arrange 4 stones of their own color, no team earns points and the game ends in a draw.

## Strategies
* To be able to win the game, you must set a game plan considering your opponent's moves.
* While applying our own plan, we must pay attention to the moves of the opponent.
* Strategies should be developed to disrupt the opponent's game.

## Restrictions
* For the first entry to the game, a 1-minute waiting time has been set for the user to wait for the opponent. If the opposing player does not join the game within 1 minute, the player who first enters the game wins.
* A 2-minute waiting period has been set for players to make their moves. If the active player does not make a move at the end of the 2-minute waiting period, the move passes to the opposing player.
* A player who doesn't make a move when it's their turn 3 times throughout a game, loses the game and the game ends.
* A player who leaves the game during the game, forfeits and loses the game.
* If the first player to enter the game leaves the game before the opposing player arrives, the active game is deleted for both sides and the game ends.

## Benefits
* Developing attention
* Abstract thinking
* Developing strategy
* Developing thinking skills.
* Gaining different perspectives.


## Technologies Used
* Vue JS
* Firebase
* Materialize CSS
* HTML 5
* CSS 3
* Animate CSS
* Vue Notification  
* Font Awesome

## Notes
* The game is (Responsive) Mobile compatible.
* Firebase config information has been removed for security reasons. You can review the [Firebase documentation](https://firebase.google.com/docs/web/setup) to add Firebase to your project.


## URL
* [Dörtleme](https://dortleme.firebaseapp.com)

<br>
<br>
 
## Installation

#### Project Installation
```
npm install
```

#### Running the Project
```
npm run serve
```
<br>
<br>


## Game Images

#### Online Users
![home](https://user-images.githubusercontent.com/25087769/78578278-f78d7a00-7837-11ea-9556-4d7e517dfeed.png)

#### Score Status
![puan-durumu](https://user-images.githubusercontent.com/25087769/78578274-f65c4d00-7837-11ea-826f-28da0983447f.png)

#### Game
![game](https://user-images.githubusercontent.com/25087769/78578280-f8261080-7837-11ea-8158-69a9eef96879.png)



## License
 [![License](https://img.shields.io/github/license/mustafadalga/dortleme)](https://github.com/mustafadalga/dortleme/blob/master/LICENSE.md)



