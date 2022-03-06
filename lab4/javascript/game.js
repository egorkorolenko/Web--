const BOARD = Array.from(Array(8), ()=>Array(8))
let BOARD_VIEW
const STATUS = document.getElementById("status")
const START_BUTTON = document.getElementById("start")
const EXAMPLE_BUTTON = document.getElementById("example")
const FINISH_TURN_BUTTON = document.getElementById("finish-turn")
let SITUATION = new Map()
let hintMode = false

let whoseTurn = 'white'

const CELL_STATE = {
    DEFAULT: 0,
    HINT:1,
    CAN_BE_FILLED: 2,
    MUST_BE_FILLED: 3
}

const CELL_STATE_CLASS = {
    [CELL_STATE.DEFAULT]:'default',
    [CELL_STATE.HINT]: 'hint',
    [CELL_STATE.CAN_BE_FILLED]: 'can-be-filled',
    [CELL_STATE.MUST_BE_FILLED]: 'must-be-filled'
}

const CHECKERS_TYPE = {
    WHITE: 1,
    WHITE_KING: -1,
    BLACK: 2,
    BLACK_KING:-2
}


const CHECKER_PIC = {
    [CHECKERS_TYPE.BLACK]: '../img/black_check.png',
    [CHECKERS_TYPE.BLACK_KING]: '../img/black_check_king.png',
    [CHECKERS_TYPE.WHITE]: '../img/white_check.png',
    [CHECKERS_TYPE.WHITE_KING]: '../img/white_check_king.png'
}
const CHECKER_COLOR = {
    [CHECKERS_TYPE.BLACK]: 'black',
    [CHECKERS_TYPE.BLACK_KING]: 'black',
    [CHECKERS_TYPE.WHITE]: 'white',
    [CHECKERS_TYPE.WHITE_KING]: 'white'
}

function isPlayableCEll(row,col){
return (row + col) % 2 === 0;
}

function hasCheckers(row, cow){
    return BOARD[row][cow]?.checker != null
}

function turn(){
if(whoseTurn === 'white'){
    whoseTurn = 'black'
    STATUS.innerText = 'Ходят черные'
}
else {
    whoseTurn = 'white'
    STATUS.innerText = 'Ходят белые'
}
hintMode = false
calculateSituation()
}

function renderCheckers(row,col){
    const  checker = BOARD[row][col].checker

    BOARD_VIEW[row][col].innerHTML = checker == null? '' : '<img src="' + CHECKER_PIC[checker.type] + '" alt="'+checker.type+'">'
}

function renderCell(row, col){
    if (!isPlayableCEll(row, col))
        return

    const state = BOARD[row][col].state

    if (state === CELL_STATE.DEFAULT)
        BOARD_VIEW[row][col].removeAttribute('class')
    else
        BOARD_VIEW[row][col].className = CELL_STATE_CLASS[state]

    renderCheckers(row, col)
}

function renderBoard(){
    for (let row = 0; row < 8; row++)
        for (let col = 0; col < 8; col++)
            renderCell(row, col)
}

function isWhite(row, col){
    const type = BOARD[row][col]?.checker?.type
    return type === CHECKERS_TYPE.WHITE || type === CHECKERS_TYPE.WHITE_KING
}

function isBlack(row, col){
    const type = BOARD[row][col]?.checker?.type
    return type === CHECKERS_TYPE.BLACK || type === CHECKERS_TYPE.BLACK_KING
}

function isOpponents(row1,col1,row2,col2){
    let color1 =CHECKER_COLOR[BOARD[row1][col1].checker?.type]
    let color2 =CHECKER_COLOR[BOARD[row2][col2].checker?.type]
    return color1 != null && color2 != null && color1 !== color2
}

function iterator (row, col, rowDir, colDir){
    return {
        next: () => {
            row += rowDir
            col += colDir

            return (row > -1 && row < 8 && col > -1 && col < 8)?
                {value: {row: row, col: col}, done: false} :
                {done: true}
        }
    }
}

function isTurnOf(row, col){
    if (!hasCheckers(row, col))
        return false

    const type = BOARD[row][col].checker.type

    return (whoseTurn === 'white' && (type === CHECKERS_TYPE.WHITE || type === CHECKERS_TYPE.WHITE_KING)) ||
        (whoseTurn === 'black' && (type === CHECKERS_TYPE.BLACK || type === CHECKERS_TYPE.BLACK_KING))
}


const addToSituation = (rowFrom, colFrom, rowTo, colTo, state) => {
    const cellFrom = BOARD[rowFrom][colFrom]
    let cellsTo = SITUATION.get(cellFrom)
    const newCell = {row: rowTo, col: colTo, state: state}

    if (cellsTo == null) {
        cellsTo = [newCell]
        SITUATION.set(cellFrom, cellsTo)
    }

    else
        cellsTo.push(newCell)
}

function calculateSituation(){
    SITUATION.clear()

    let foundMustBeFilled = false

    for (let row = 0; row < 8; row++)
        for (let col = 0; col < 8; col++) {
            if (!isTurnOf(row, col))
                continue

            const type = BOARD[row][col].checker.type

            if (type === CHECKERS_TYPE.WHITE_KING || type === CHECKERS_TYPE.BLACK_KING)
                for (let i of [iterator(row, col, 1, -1),
                    iterator(row, col, 1, 1),
                    iterator(row, col, -1, 1),
                    iterator(row, col, -1, -1)]) {
                    let res = i.next()
                    let foundFoe = false

                    while (!res.done) {
                        let {row: rowTo, col: colTo} = res.value

                        if (!hasCheckers(rowTo, colTo)) {
                            if (foundFoe) {
                                addToSituation(row, col, rowTo, colTo, CELL_STATE.MUST_BE_FILLED)
                                foundMustBeFilled = true
                                break
                            }

                            else if (!foundMustBeFilled)
                                addToSituation(row, col, rowTo, colTo, CELL_STATE.CAN_BE_FILLED)
                        }

                        else if (isOpponents(row, col, rowTo, colTo))
                            foundFoe = true

                        else
                            break

                        res = i.next()
                    }
                }

            else {
                if (row < 8 - 2) {
                    if (col > 1 && isOpponents(row, col, row + 1, col - 1) && !hasCheckers(row + 2, col - 2)) {
                        addToSituation(row, col, row + 2, col - 2, CELL_STATE.MUST_BE_FILLED)
                        foundMustBeFilled = true
                    }

                    if (col < 8 - 2 && isOpponents(row, col, row + 1, col + 1) && !hasCheckers(row + 2, col + 2)) {
                        addToSituation(row, col, row + 2, col + 2, CELL_STATE.MUST_BE_FILLED)
                        foundMustBeFilled = true
                    }
                }

                if (row > 1) {
                    if (col > 1 && isOpponents(row, col, row - 1, col - 1) && !hasCheckers(row - 2, col - 2)) {
                        addToSituation(row, col, row - 2, col - 2, CELL_STATE.MUST_BE_FILLED)
                        foundMustBeFilled = true
                    }

                    if (col < 8 - 2 && isOpponents(row, col, row - 1, col + 1) && !hasCheckers(row - 2, col + 2)) {
                        addToSituation(row, col, row - 2, col + 2, CELL_STATE.MUST_BE_FILLED)
                        foundMustBeFilled = true
                    }
                }

                if (!foundMustBeFilled) {
                    if (isWhite(row, col) && row < 8 - 1) {
                        if (col > 0 && !hasCheckers(row + 1, col - 1))
                            addToSituation(row, col, row + 1, col - 1, CELL_STATE.CAN_BE_FILLED)

                        if (col < 8 - 1 && !hasCheckers(row + 1, col + 1))
                            addToSituation(row, col, row + 1, col + 1, CELL_STATE.CAN_BE_FILLED)
                    }

                    else if (isBlack(row, col) && row > 0) {
                        if (col > 0 && !hasCheckers(row - 1, col - 1))
                            addToSituation(row, col, row - 1, col - 1, CELL_STATE.CAN_BE_FILLED)

                        if (col < 8 - 1 && !hasCheckers(row - 1, col + 1))
                            addToSituation(row, col, row - 1, col + 1, CELL_STATE.CAN_BE_FILLED)
                    }
                }
            }
        }

    if (foundMustBeFilled)
        for (let entry of SITUATION) {
            const [cellFrom, cellsTo] = entry
            const filteredCellsTo = cellsTo.filter(cellTo => cellTo.state === CELL_STATE.MUST_BE_FILLED)

            if (filteredCellsTo.length === 0)
                SITUATION.delete(cellFrom)
            else
                SITUATION.set(cellFrom, filteredCellsTo)
        }
}

function hint_mode(row, col){

    if (!isTurnOf(row, col))
        return []

    const state = BOARD[row][col].state
    const cellsTo = SITUATION.get(BOARD[row][col]) || []

    if (hintMode && state === CELL_STATE.HINT) {
        hintMode = false
        BOARD[row][col].state = CELL_STATE.DEFAULT
        let cell;
        for (cell of cellsTo)
            BOARD[cell.row][cell.col].state = CELL_STATE.DEFAULT
    }

    else if (!hintMode && state === CELL_STATE.DEFAULT) {
        hintMode = true
        BOARD[row][col].state = CELL_STATE.HINT
        let cell;
        for (cell of cellsTo)
            BOARD[cell.row][cell.col].state = cell.state
    }

    return cellsTo.map(cell => ({row: cell.row, col: cell.col}))
}

function clickOnCell(row, col){
    let selectedCell  = hint_mode(row, col)
    renderCell(row,col)
    selectedCell.forEach(cell => renderCell(cell.row, cell.col))
}

function start(){
        for (let row = 0; row < 3; row++)
            for (let col = 0; col < 8; col++)
                if (isPlayableCEll(row, col))
                    BOARD[row][col].checker = {type: CHECKERS_TYPE.WHITE}


    for (let row = 3; row < 5; row++)
        for (let col = 0; col < 8; col++)
            if (isPlayableCEll(row, col))
                BOARD[row][col].checker = null

        for (let row = 5; row < 8; row++)
            for (let col = 0; col < 8; col++)
                if (isPlayableCEll(row, col))
                    BOARD[row][col].checker = {type: CHECKERS_TYPE.BLACK}
}

function exampleCreate(){
    for (let row = 0; row < 8; row++)
        for (let col = 0; col < 8; col++)
            if (isPlayableCEll(row, col))
                BOARD[row][col].checker = null

    BOARD[3][5].checker = {type: CHECKERS_TYPE.WHITE}
    BOARD[3][7].checker = {type: CHECKERS_TYPE.WHITE}

    BOARD[7][1].checker = {type: CHECKERS_TYPE.BLACK}
    BOARD[0][2].checker = {type: CHECKERS_TYPE.BLACK_KING}
    BOARD[4][2].checker = {type: CHECKERS_TYPE.BLACK}
    BOARD[6][2].checker = {type: CHECKERS_TYPE.BLACK}
    BOARD[6][4].checker = {type: CHECKERS_TYPE.BLACK}
    BOARD[5][7].checker = {type: CHECKERS_TYPE.BLACK}
}


function init(){
    for (let row = 0; row < 8; row++)
        for (let col = 0; col < 8; col++)
            if (isPlayableCEll(row, col))
                BOARD[row][col] = {state: CELL_STATE.DEFAULT}

    let col = 0

    BOARD_VIEW = Array.from(document.querySelectorAll('.board tr td'))
        .reduce((arr, cell, index) => {
            const row = 8 - 1 - Math.floor(index / 8)

            arr[row] = arr[row] || []
            arr[row].push(isPlayableCEll(row, col)? cell : null)

            col = (++col) % 8

            return arr
        }, Array(8))

    for (let row = 0; row < 8; row++)
        for (let col = 0; col < 8; col++)
            BOARD_VIEW[row][col]?.addEventListener('click',()=> clickOnCell(row, col))

    START_BUTTON.addEventListener('click',()=>{
        start()
        calculateSituation()
        renderBoard()

    })
    EXAMPLE_BUTTON.addEventListener('click',()=>{
        exampleCreate()
        calculateSituation()
        renderBoard()

    })
    FINISH_TURN_BUTTON.addEventListener('click',()=>turn())
}

init()