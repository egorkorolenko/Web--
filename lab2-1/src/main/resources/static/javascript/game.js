const BOARD = Array.from(Array(8), () => Array(8))
const STATUS = document.getElementById('status')
const START_BUTTON = document.getElementById('start')
const EXAMPLE = document.getElementById('example')
const CANCEL_TURN_BUTTON = document.getElementById('cancel-turn')
const FINISH_TURN_BUTTON = document.getElementById('finish-turn')
const MOVE_LIST_VIEW = document.getElementById('move-list')
const MOVE_LIST_INPUT = document.getElementById('move-list-input')
const SHOW_TURNS_BUTTON = document.getElementById('show-turns')
const ERROR_FIELD = document.getElementById('error-field')
const PATH_IMAGE = document.getElementById('js')

let BOARD_MAP
let BOARD_VIEW
let SITUATION = new Map()
let hintModeStatus = null
let curMoves = []
let moveList = []
let becomeKing = false
let killed = []
let whoseTurn = 'white'
let buttonsActivate = false
let whiteCounter = 0
let blackCounter = 0

const CELL_STATE = {
    DEFAULT: 0,
    HINT: 1,
    CAN_BE_FILLED: 2,
    MUST_BE_FILLED: 3,
    KILLED: 4
}

const CELL_STATE_CLASS = {
    [CELL_STATE.HINT]: 'hint',
    [CELL_STATE.CAN_BE_FILLED]: 'can-be-filled',
    [CELL_STATE.MUST_BE_FILLED]: 'must-be-filled',
    [CELL_STATE.KILLED]: 'killed'
}
const CHECKERS_TYPE = {
    BLACK: -1,
    BLACK_KING: -2,
    WHITE: 1,
    WHITE_KING: 2
}

//у меня спринг не отображал пнг почему-то
const CHECKER_PIC = {
    [CHECKERS_TYPE.BLACK]: "img/black_check.jpg",
    [CHECKERS_TYPE.BLACK_KING]: "black_check_king.jpg",
    [CHECKERS_TYPE.WHITE]: "img/white_check.jpg",
    [CHECKERS_TYPE.WHITE_KING]: "img/white_check_king.jpg"
}

const CHECKER_COLOR = {
    [CHECKERS_TYPE.BLACK]: 'black',
    [CHECKERS_TYPE.BLACK_KING]: 'black',
    [CHECKERS_TYPE.WHITE]: 'white',
    [CHECKERS_TYPE.WHITE_KING]: 'white'
}

function isPlayableCEll(row, col) {
    return (row + col) % 2 === 0 && row >= 0 && row < 8 && col >= 0 && col < 8
}

function hasChecker(row, col) {
    return BOARD[row][col]?.checker != null
}

function renderChecker(row, col) {
    const checker = BOARD[row][col].checker
    // BOARD_VIEW[row][col].innerHTML = checker == null ? '' : '<img th:src="' + CHECKER_PIC[checker.type] +'" alt="шашка">'
    BOARD_VIEW[row][col].innerHTML = checker == null ? '' :  '<img src="'+ CHECKER_PIC[checker.type] +'" alt="шашка">'
}

function place(type, row, col) {
    const cell = BOARD[row][col]
    cell.checker = {type: type, cell: cell}
}

function clearChecker(row, col) {
    BOARD[row][col].checker = null
}

function move(rowFrom, colFrom, rowTo, colTo) {
    const type = BOARD[rowFrom][colFrom].checker.type
    clearChecker(rowFrom, colFrom)
    place(type, rowTo, colTo)
}


function renderCell(row, col) {
    if (!isPlayableCEll(row, col))
        return

    const state = BOARD[row][col].state

    if (state === CELL_STATE.DEFAULT)
        BOARD_VIEW[row][col].removeAttribute('class')
    else
        BOARD_VIEW[row][col].className = CELL_STATE_CLASS[state]

    renderChecker(row, col)
}

function renderBoard() {
    for (let row = 0; row < 8; row++)
        for (let col = 0; col < 8; col++)
            renderCell(row, col)
}


function toggleTurn() {
    whoseTurn = whoseTurn === 'white' ? 'black' : 'white'
    calculateSituation()
}


function renderStatus() {
    if (whiteCounter === 0 || blackCounter === 0)
        STATUS.innerText = 'Победа ' + (whoseTurn === 'white' ? 'чёрных' : 'белых')

    else
        STATUS.innerText = 'Ходят ' + (whoseTurn === 'white' ? 'белые' : 'чёрные')
}

function activateButtons() {
    if (buttonsActivate) {
        CANCEL_TURN_BUTTON.disabled = false
        FINISH_TURN_BUTTON.disabled = false
    } else {
        CANCEL_TURN_BUTTON.disabled = true
        FINISH_TURN_BUTTON.disabled = true
    }
}


function cellToString(cell) {
    const letters = 'abcdefgh'

    return letters[cell.col] + (cell.row + 1)
}

function stringToCell(string) {
    const letters = 'abcdefgh'
    const row = Number(string[1]) - 1
    const col = letters.indexOf(string[0])

    if (!isPlayableCEll(row, col) || string.length !== 2)
        return null

    return BOARD[row][col]
}

function pushCurMovesToMoveList() {
    moveList.push({
        moves: [...curMoves],
        haveKilled: killed.length !== 0,
        whoseTurn: whoseTurn
    })
}


function renderMoveListEntry(entry) {
    const delimiter = entry.haveKilled ? ':' : '-'

    if (entry.whoseTurn === 'white') {
        const turnView = document.createElement('li')
        turnView.appendChild(document.createTextNode(entry.moves.map(cell => cellToString(cell)).join(delimiter)))
        MOVE_LIST_VIEW.appendChild(turnView)
    } else {
        const moveViews = MOVE_LIST_VIEW.getElementsByTagName('li')
        const turnView = moveViews[moveViews.length - 1]
        turnView.textContent += ' ' + entry.moves.map(cell => cellToString(cell)).join(delimiter)
    }

    MOVE_LIST_VIEW.scrollTop = MOVE_LIST_VIEW.scrollHeight
}


function renderLastMoveListEntry() {
    renderMoveListEntry(moveList[moveList.length - 1])
}


function renderMoveList() {
    MOVE_LIST_VIEW.innerHTML = ''
    moveList.forEach(entry => renderMoveListEntry(entry))
}


function isWhite(row, col) {
    const type = BOARD[row][col]?.checker?.type

    return type === CHECKERS_TYPE.WHITE || type === CHECKERS_TYPE.WHITE_KING
}


function isBlack(row, col) {
    const type = BOARD[row][col]?.checker?.type

    return type === CHECKERS_TYPE.BLACK || type === CHECKERS_TYPE.BLACK_KING
}

function isTurnOf(row, col) {
    if (!hasChecker(row, col))
        return false

    const type = BOARD[row][col].checker.type

    return (whoseTurn === 'white' && (type === CHECKERS_TYPE.WHITE || type === CHECKERS_TYPE.WHITE_KING)) ||
        (whoseTurn === 'black' && (type === CHECKERS_TYPE.BLACK || type === CHECKERS_TYPE.BLACK_KING))
}


function addToSituation(cell, dest, state, foe) {
    let dests = SITUATION.get(cell)
    const newDest = {dest: dest, state: state, foe: foe}

    if (dests === undefined)
        SITUATION.set(cell, [newDest])

    else
        dests.push(newDest)
}


function isOpponents(row1, col1, row2, col2) {
    const color1 = CHECKER_COLOR[BOARD[row1][col1]?.checker?.type]
    const color2 = CHECKER_COLOR[BOARD[row2][col2]?.checker?.type]

    return color1 != null && color2 != null && color1 !== color2
}


function iterator(row, col, rowDir, colDir) {
    return {
        next: () => {
            row += rowDir
            col += colDir

            return (row > -1 && row < 8 && col > -1 && col < 8) ?
                {value: {row: row, col: col}, done: false} :
                {done: true}
        }
    }
}

function calculateSituation() {
    SITUATION.clear()

    let foundMustBeFilled = false

    for (let row = 0; row < 8; row++)
        for (let col = 0; col < 8; col++) {
            if (!isTurnOf(row, col))
                continue

            const type = BOARD[row][col].checker.type

            if (type === CHECKERS_TYPE.WHITE_KING || type === CHECKERS_TYPE.BLACK_KING)
                for (let it of [iterator(row, col, 1, -1),
                    iterator(row, col, 1, 1),
                    iterator(row, col, -1, 1),
                    iterator(row, col, -1, -1)]) {
                    let res = it.next()
                    let foe = null

                    while (!res.done) {
                        let {row: rowTo, col: colTo} = res.value

                        if (!hasChecker(rowTo, colTo)) {
                            if (foe !== null) {
                                addToSituation(BOARD[row][col], BOARD[rowTo][colTo], CELL_STATE.MUST_BE_FILLED, foe)
                                foundMustBeFilled = true
                            } else if (!foundMustBeFilled)
                                addToSituation(BOARD[row][col], BOARD[rowTo][colTo], CELL_STATE.CAN_BE_FILLED)
                        } else if (foe === null && isOpponents(row, col, rowTo, colTo))
                            foe = BOARD[rowTo][colTo]

                        else
                            break

                        res = it.next()
                    }
                }

            else {
                if (row < 8 - 2) {
                    if (col > 1 && isOpponents(row, col, row + 1, col - 1) && !hasChecker(row + 2, col - 2)) {
                        addToSituation(BOARD[row][col], BOARD[row + 2][col - 2], CELL_STATE.MUST_BE_FILLED, BOARD[row + 1][col - 1])
                        foundMustBeFilled = true
                    }

                    if (col < 8 - 2 && isOpponents(row, col, row + 1, col + 1) && !hasChecker(row + 2, col + 2)) {
                        addToSituation(BOARD[row][col], BOARD[row + 2][col + 2], CELL_STATE.MUST_BE_FILLED, BOARD[row + 1][col + 1])
                        foundMustBeFilled = true
                    }
                }

                if (row > 1) {
                    if (col > 1 && isOpponents(row, col, row - 1, col - 1) && !hasChecker(row - 2, col - 2)) {
                        addToSituation(BOARD[row][col], BOARD[row - 2][col - 2], CELL_STATE.MUST_BE_FILLED, BOARD[row - 1][col - 1])
                        foundMustBeFilled = true
                    }

                    if (col < 8 - 2 && isOpponents(row, col, row - 1, col + 1) && !hasChecker(row - 2, col + 2)) {
                        addToSituation(BOARD[row][col], BOARD[row - 2][col + 2], CELL_STATE.MUST_BE_FILLED, BOARD[row - 1][col + 1])
                        foundMustBeFilled = true
                    }
                }

                if (!foundMustBeFilled) {
                    if (isWhite(row, col) && row < 8 - 1) {
                        if (col > 0 && !hasChecker(row + 1, col - 1))
                            addToSituation(BOARD[row][col], BOARD[row + 1][col - 1], CELL_STATE.CAN_BE_FILLED)

                        if (col < 8 - 1 && !hasChecker(row + 1, col + 1))
                            addToSituation(BOARD[row][col], BOARD[row + 1][col + 1], CELL_STATE.CAN_BE_FILLED)
                    } else if (isBlack(row, col) && row > 0) {
                        if (col > 0 && !hasChecker(row - 1, col - 1))
                            addToSituation(BOARD[row][col], BOARD[row - 1][col - 1], CELL_STATE.CAN_BE_FILLED)

                        if (col < 8 - 1 && !hasChecker(row - 1, col + 1))
                            addToSituation(BOARD[row][col], BOARD[row - 1][col + 1], CELL_STATE.CAN_BE_FILLED)
                    }
                }
            }
        }

    if (foundMustBeFilled)
        for (let entry of SITUATION) {
            const [cellFrom, cellsTo] = entry
            const filteredCellsTo = cellsTo.filter(cellTo => cellTo.state === CELL_STATE.MUST_BE_FILLED && cellTo.foe.state !== CELL_STATE.KILLED)

            if (filteredCellsTo.length === 0)
                SITUATION.delete(cellFrom)
            else
                SITUATION.set(cellFrom, filteredCellsTo)
        }
}


function hint_mode(cell) {
    if (!isTurnOf(cell.row, cell.col))
        return []

    const dests = SITUATION.get(cell) ?? []

    if (hintModeStatus === cell) {
        hintModeStatus = null
        cell.state = CELL_STATE.DEFAULT

        let dest;
        for (dest of dests)
            dest.dest.state = CELL_STATE.DEFAULT
    } else if (hintModeStatus === null && (curMoves.length === 0 || (killed.length !== 0 && dests.length !== 0))) {
        hintModeStatus = cell
        cell.state = CELL_STATE.HINT

        let dest;
        for (dest of dests)
            dest.dest.state = dest.state
    }

    let changedCells = dests.map(dest => dest.dest)
    changedCells.push(cell)

    return changedCells
}


function makeKing(cell) {
    if (whoseTurn === 'white' && cell.row === 8 - 1) {
        cell.checker.type = CHECKERS_TYPE.WHITE_KING
        becomeKing = true
    } else if (whoseTurn === 'black' && cell.row === 0) {
        cell.checker.type = CHECKERS_TYPE.BLACK_KING
        becomeKing = true
    }
}


function hintOrMove(row, col) {
    let changedCells = []
    let targetCell = BOARD[row][col]

    if (hintModeStatus === null || (curMoves.length === 0 && hintModeStatus === targetCell))
        changedCells = hint_mode(targetCell)

    else if (targetCell.state === CELL_STATE.CAN_BE_FILLED) {
        curMoves = [hintModeStatus]
        changedCells = hint_mode(hintModeStatus)
        move(curMoves[0].row, curMoves[0].col, row, col)
        curMoves[1] = targetCell

        makeKing(targetCell)
    } else if (targetCell.state === CELL_STATE.MUST_BE_FILLED) {
        const wasInHintMode = hintModeStatus
        changedCells = hint_mode(hintModeStatus)
        move(wasInHintMode.row, wasInHintMode.col, row, col)

        if (curMoves.length === 0)
            curMoves = [wasInHintMode]
        curMoves.push(BOARD[row][col])

        makeKing(targetCell)

        const killedCell = SITUATION.get(BOARD[wasInHintMode.row][wasInHintMode.col])
            .filter(dest => dest.dest.row === row && dest.dest.col === col)[0].foe
        killedCell.state = CELL_STATE.KILLED
        changedCells.push(killedCell)
        killed.push(killedCell)

        calculateSituation()
        changedCells = changedCells.concat(hint_mode(targetCell))
    }

    buttonsActivate = (curMoves.length !== 0)

    return changedCells
}


function performHalfTurn(halfTurn, haveKilled) {
    let changedCells = []

    killed = []
    halfTurn.forEach(cell => {
        changedCells = hintOrMove(cell.row, cell.col)
    })

    if (changedCells.length === 0)
        throw new Error('Useless click')

    else if ((killed.length === 0 && haveKilled) || (killed.length !== 0 && !haveKilled))
        throw new Error('Factual killed do not correspond stated ones')

    finishTurn()
    clearAfterTurnFinish()
}


function performTurns(turns) {
    for (let lineIndex = 0; lineIndex < turns.length; lineIndex++) {
        const turn = turns[lineIndex]

        try {
            if (turn.whiteCheck !== undefined)
                performHalfTurn(turn.whiteCheck, turn.whiteHaveKilled)

            if (turn.blackCheck !== undefined)
                performHalfTurn(turn.blackCheck, turn.blackHaveKilled)
        } catch (e) {
            return lineIndex
        }

        if (turn.whiteCheck === undefined || (turn.blackCheck === undefined && lineIndex !== turns.length - 1))
            return lineIndex
    }
}


function clickOnCell(row, col) {
    hintOrMove(row, col).forEach(cell => renderCell(cell.row, cell.col))
    activateButtons()
}

function countCheckers() {
    whiteCounter = 0
    blackCounter = 0

    for (let row = 0; row < 8; row++)
        for (let col = 0; col < 8; col++) {
            if (isWhite(row, col))
                whiteCounter++

            else if (isBlack(row, col))
                blackCounter++
        }
}


function resetEverything() {
    for (let row = 0; row < 8; row++)
        for (let col = 0; col < 8; col++)
            if (isPlayableCEll(row, col)) {
                BOARD[row][col].state = CELL_STATE.DEFAULT
                clearChecker(row, col)
            }

    SITUATION.clear()
    hintModeStatus = null
    curMoves = []
    moveList = []
    becomeKing = false
    killed = []
    whoseTurn = 'white'
    buttonsActivate = false
}


function renderEverything() {
    renderBoard()
    renderStatus()
    activateButtons()
    renderMoveList()
}


function arrangementButtonOnClick(arrangement) {
    resetEverything()
    arrangement()
    countCheckers()
    calculateSituation()
    renderEverything()
}


function writeToErrorField(...lines) {
    if (lines.length !== 0) {
        ERROR_FIELD.innerHTML = ''
        lines.forEach(line => {
            const par = document.createElement('p')
            par.appendChild(document.createTextNode(line))
            ERROR_FIELD.appendChild(par)
        })
    }
}


function cancelTurn() {
    const changedCells = []
    const curCell = curMoves.length === 0 ? hintModeStatus : curMoves[curMoves.length - 1]

    SITUATION.get(curCell)?.forEach(dest => {
        dest.dest.state = CELL_STATE.DEFAULT
        changedCells.push(dest.dest)
    })

    if (curMoves.length !== 0) {
        if (becomeKing) {
            curCell.checker.type = whoseTurn === 'white' ? CHECKERS_TYPE.WHITE : CHECKERS_TYPE.BLACK
            becomeKing = false
        }

        curMoves[0].checker = curCell.checker
        curCell.checker = null
        curCell.state = CELL_STATE.DEFAULT

        changedCells.push(curMoves[0])
        changedCells.push(curCell)
    } else {
        hintModeStatus.state = CELL_STATE.DEFAULT
        changedCells.push(hintModeStatus)
    }

    if (killed.length !== 0) {
        for (let cell of killed) {
            cell.state = CELL_STATE.DEFAULT
            changedCells.push(cell)
        }
    }

    return changedCells
}

function cancelTurnButtonOnClick(){
    if (curMoves.length === 0 && hintModeStatus === null)
        return
    cancelTurn().forEach(cell => renderCell(cell.row, cell.col))
    clearAfterTurnCancel()
    calculateSituation()
    activateButtons()
}

function clearAfterTurnCancel() {
    curMoves = []
    hintModeStatus = null
    killed = []
    buttonsActivate = false
}

function finishTurn() {
    for (let cell of killed) {
        const {row, col} = cell
        clearChecker(row, col)
        BOARD[row][col].state = CELL_STATE.DEFAULT
    }

    if (whoseTurn === 'white')
        blackCounter -= killed.length
    else
        whiteCounter -= killed.length

    pushCurMovesToMoveList()
    toggleTurn()
}


function finishTurnButtonOnClick() {
    if (curMoves.length === 0 || hintModeStatus !== null)
        return

    finishTurn()

    for (let cell of killed)
        renderCell(cell.row, cell.col)

    clearAfterTurnFinish()
    renderLastMoveListEntry()
    renderStatus()
    activateButtons()
}

function clearAfterTurnFinish() {
    curMoves = []
    becomeKing = false
    killed = []
    buttonsActivate = false
}

function moveListViewOnCopy(event) {
    event.preventDefault()
    event.clipboardData.setData('text',
        document
            .getSelection()
            .toString()
            .split('\n')
            .map((line, index) => (index + 1) + '. ' + line)
            .join('\n'))
}


function parseTurns(lines) {
    let result = {turns: []}

    for (let line of lines) {
        const splitLine = line.split(/\s+/)

        try {
            result.turns.push({
                whiteCheck: splitLine[1]?.split(/[-:]/).map(cellStr => stringToCell(cellStr)),
                whiteHaveKilled: splitLine[1]?.includes(':'),
                blackCheck: splitLine[2]?.split(/[-:]/).map(cellStr => stringToCell(cellStr)),
                blackHaveKilled: splitLine[2]?.includes(':')
            })
        } catch (e) {
            result.errorLine = line
            break
        }
    }

    return result
}


function showTurnsButtonOnClick() {
    writeToErrorField('', '')
    arrangementButtonOnClick(start)

    const lines = MOVE_LIST_INPUT.value.split('\n').map(line => line.trim()).filter(line => line !== '')
    let {turns, errorLine} = parseTurns(lines)
    errorLine = lines[performTurns(turns)] ?? errorLine

    renderEverything()

    if (errorLine !== undefined) {
        writeToErrorField('Запись партии разобрать не\xa0удалось. Строка с\xa0ошибкой:', errorLine)
    }
}


function start() {
    BOARD_MAP =
        [[0, -1, 0, -1, 0, -1, 0, -1],
            [-1, 0, -1, 0, -1, 0, -1, 0],
            [0, -1, 0, -1, 0, -1, 0, -1],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [1, 0, 1, 0, 1, 0, 1, 0],
            [0, 1, 0, 1, 0, 1, 0, 1],
            [1, 0, 1, 0, 1, 0, 1, 0]];

    BOARD_MAP.reverse();

    arrange()
}


function exampleCreate() {
    BOARD_MAP = [
            [0, -1, 0, 0, 0, 0, 0, 0],
            [0, 0, -1, 0, -1, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, -1],
            [0, 0, -1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 0, 1],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, -2, 0, 0, 0, 0, 0]];

    BOARD_MAP.reverse();
    arrange()
}


function arrange() {

    for (let row = 0; row < 8; row++)
        for (let col = 0; col < 8; col++)
            if (isPlayableCEll(row, col))
                clearChecker(row, col)

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (!isPlayableCEll(row, col)) {
                continue;
            }
            if (BOARD_MAP[row][col] === -1) {
                place(CHECKERS_TYPE.BLACK, row, col)
            } else if (BOARD_MAP[row][col] === 1) {
                place(CHECKERS_TYPE.WHITE, row, col)
            } else if (BOARD_MAP[row][col] === -2) {
                place(CHECKERS_TYPE.BLACK_KING, row, col)
            } else if (BOARD_MAP[row][col] === 2) {
                place(CHECKERS_TYPE.WHITE_KING, row, col)
            }
        }
    }
}

function init() {
    activateButtons()

    for (let row = 0; row < 8; row++)
        for (let col = 0; col < 8; col++)
            if (isPlayableCEll(row, col))
                BOARD[row][col] = {row: row, col: col, state: CELL_STATE.DEFAULT}
    let col = 0

    BOARD_VIEW = Array.from(document.querySelectorAll('.board tr td'))
        .reduce((arr, cell, index) => {
            const row = 8 - 1 - Math.floor(index / 8)
            arr[row] = arr[row] ?? []
            arr[row].push(isPlayableCEll(row, col) ? cell : null)
            col = (++col) % 8
            return arr
        }, Array(8))

    for (let row = 0; row < 8; row++)
        for (let col = 0; col < 8; col++)
            BOARD_VIEW[row][col]?.addEventListener('click', () => clickOnCell(row, col))

    START_BUTTON.addEventListener('click', () => arrangementButtonOnClick(start))
    EXAMPLE.addEventListener('click', () => arrangementButtonOnClick(exampleCreate))
    CANCEL_TURN_BUTTON.addEventListener('click', () => cancelTurnButtonOnClick())
    FINISH_TURN_BUTTON.addEventListener('click', () => finishTurnButtonOnClick())
    MOVE_LIST_VIEW.addEventListener('copy', (event) => moveListViewOnCopy(event))
    SHOW_TURNS_BUTTON.addEventListener('click', () => showTurnsButtonOnClick())
}


init()