(function() {
    const canvas = document.getElementById("paint_canvas")

    if (!canvas.getContext) {
        const canvasNotSupported = document.querySelector(".canvas-not-supported-holder")

        canvasNotSupported.style.display = "block"

        return void 0
    }

    const ctx = canvas.getContext("2d")
    
    canvas.resize = function() {
        const { innerWidth, innerHeight } = window

        this.width = innerWidth
        this.height = innerHeight

        this.style.width = `${innerWidth}px`
        this.style.height = `${innerHeight}px`

        gridManager.create()
    }

    class Shape {
        static scale = 50

        constructor(index, x, y) {
            this.index = index
            this._x = x
            this._y = y

            this.scale = Shape.scale

            this.fillColor = pointer.color
        }

        get x() {
            return this._x - this.scale / 2
        }

        get y() {
            return this._y - this.scale / 2
        }

        draw() {
            ctx.save()
            ctx.fillStyle = this.fillColor

            ctx.fillRect(this.x, this.y, this.scale, this.scale)
            ctx.restore()
        }
    }

    class ShapeManager {
        constructor() {
            this.shapes = {}
        }

        create(x, y, nearGrid) {
            const index = Math.floor(Math.random() * 7e9)
            const shape = new Shape(index, x, y)

            if (nearGrid.shape) return void 0

            nearGrid.shape = shape

            shape.nearGrid = nearGrid

            this.shapes[index] = shape
        }

        remove(index) {
            delete this.shapes[index].nearGrid.shape

            delete this.shapes[index]
        }

        update() {
            const shapes = Object.values(this.shapes)

            let i = shapes.length

            while (i--) {
                shapes[i].draw()
            }
        }
    }

    const shapeManager = new ShapeManager()

    class Grid {
        constructor(count, x, y, scale) {
            this.count = count
            this.x = x
            this.y = y
            this.scale = scale

            this.strokeColor = "#707070"

            this.textFont = "bold 20px Courier New"
            this.textColor = "#707070"
        }

        get middleX() {
            return this.x + this.scale / 2
        }

        get middleY() {
            return this.y + this.scale / 2
        }

        draw() {
            ctx.save()
            ctx.strokeStyle = this.strokeColor

            ctx.strokeRect(this.x, this.y, this.scale, this.scale)
            ctx.restore()

            const metrics = ctx.measureText(this.count.toString())
            const width = metrics.width
            const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent

            ctx.save()
            ctx.font = this.textFont
            ctx.fillStyle = this.textColor

            ctx.fillText(this.count, this.middleX - width, this.middleY + height)
            ctx.restore()

        }
    }

    class GridManager {
        constructor() {
            this.grids = []
        }

        get maxGridsByWidth() {
            return Math.round(canvas.width / Shape.scale) + 1
        }

        get maxGridsByHeight() {
            return Math.round(canvas.height / Shape.scale) + 1
        }

        create() {
            this.grids = []

            for (let x = 0; x < this.maxGridsByWidth; x++) {
                for (let y = 0; y < this.maxGridsByHeight; y++) {
                    const _x = Shape.scale * x
                    const _y = Shape.scale * y

                    this.grids.push(new Grid(this.grids.length + 1, _x, _y, Shape.scale))
                }
            }
        }

        update() {
            let i = this.grids.length

            while (i--) {
                this.grids[i].draw()
            }
        }
    }

    const gridManager = new GridManager()

    class Pointer {
        constructor() {
            this.x = null
            this.y = null

            this.pencil = false
            this.eraser = false

            this.color = "#2d2d2d"
        }

        onDown(event) {
            if (event.button === 2) {
                this.eraser = true
    
                return void 0
            }

            this.pencil = true
        }

        onUp() {
            this.pencil = false
            this.eraser = false
        }

        onMove(event) {
            this.x = event.clientX
            this.y = event.clientY
        }

        draw() {
            const nearGrid = gridManager.grids.filter(
                (grid) => Math.abs(grid.x - this.x) < Shape.scale &&
                Math.abs(grid.y - this.y) < Shape.scale)[0]

            shapeManager.create(nearGrid.middleX, nearGrid.middleY, nearGrid)
        }

        clean() {
            const nearGrid = gridManager.grids.filter(
                (grid) => Math.abs(grid.x - this.x) < Shape.scale &&
                Math.abs(grid.y - this.y) < Shape.scale)[0]

            if (!nearGrid.shape) return void 0

            return shapeManager.remove(nearGrid.shape.index)
        }

        init() {
            canvas.addEventListener("mousemove", this.onMove.bind(this))

            canvas.addEventListener("mousedown", this.onDown.bind(this))
            canvas.addEventListener("mouseup", this.onUp.bind(this))
        }
    }

    const pointer = new Pointer()
    const pencilColorInput = document.getElementById("pencilColor")

    pencilColorInput.offset = 20

    pencilColorInput.getX = function() {
        return parseInt(this.style.left)
    }

    pencilColorInput.getY = function() {
        return parseInt(this.style.top)
    }

    pencilColorInput.drag = function(x, y) {
        this.style.left = `${x}px`
        this.style.top = `${y}px`
    }
    
    pencilColorInput.addEventListener("input", (event) => {
        pointer.color = pencilColorInput.value
    })

    function doUpdate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        if (pencilColorInput.getX() !== pointer.x + pencilColorInput.offset &&
            pencilColorInput.getY() !== pointer.y + pencilColorInput.offset) {
            pencilColorInput.drag(pointer.x + pencilColorInput.offset, pointer.y + pencilColorInput.offset)
        }

        gridManager.update()

        if (pointer.pencil) {
            pointer.draw()
        }

        if (pointer.eraser) {
            pointer.clean()
        }

        shapeManager.update()

        requestAnimationFrame(doUpdate)
    }

    function init() {
        canvas.resize()

        window.addEventListener("resize", canvas.resize.bind(canvas))

        pointer.init()

        doUpdate()
    }

    window.onload = init
})()