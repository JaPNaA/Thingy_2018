// C++Sweeper.cpp : Defines the entry point for the console application.
//

#include "stdafx.h"
#include <iostream>
#include <string>
#include <ctime>
#include <chrono>
#include <vector>
#include <Windows.h>
#include <conio.h>

#define PERR(bSuccess, api){if(!(bSuccess)) printf("%s:Error %d from %s on line %d\n", __FILE__, GetLastError(), api, __LINE__);}

struct Console {
	HANDLE hConsole;
	void clear();
	void log(std::string e);
	void color(int e);
	Console() {
		hConsole = GetStdHandle(STD_OUTPUT_HANDLE);
	}
};

void Console::clear() {
	COORD coordScreen = { 0, 0 };    /* here's where we'll home the
									 cursor */
	BOOL bSuccess;
	DWORD cCharsWritten;
	CONSOLE_SCREEN_BUFFER_INFO csbi; /* to get buffer info */
	DWORD dwConSize;                 /* number of character cells in
									 the current buffer */

									 /* get the number of character cells in the current buffer */
	bSuccess = GetConsoleScreenBufferInfo(hConsole, &csbi);
	PERR(bSuccess, "GetConsoleScreenBufferInfo");
	dwConSize = csbi.dwSize.X * csbi.dwSize.Y;

	/* fill the entire screen with blanks */
	bSuccess = FillConsoleOutputCharacter(hConsole, (TCHAR) ' ',
		dwConSize, coordScreen, &cCharsWritten);
	PERR(bSuccess, "FillConsoleOutputCharacter");

	/* get the current text attribute */
	bSuccess = GetConsoleScreenBufferInfo(hConsole, &csbi);
	PERR(bSuccess, "ConsoleScreenBufferInfo");

	/* now set the buffer's attributes accordingly */
	bSuccess = FillConsoleOutputAttribute(hConsole, csbi.wAttributes,
		dwConSize, coordScreen, &cCharsWritten);
	PERR(bSuccess, "FillConsoleOutputAttribute");

	/* put the cursor at (0, 0) */
	bSuccess = SetConsoleCursorPosition(hConsole, coordScreen);
	PERR(bSuccess, "SetConsoleCursorPosition");
	return;
};

void Console::log(std::string e = "") {
	std::cout << e << std::endl;
};

void Console::color(int e) {
	SetConsoleTextAttribute(hConsole, e);
}

Console console;

class Game {
private:
	short unsigned int
		width = 9,
		height = 9,
		mines = 9,
		grid[9][9] = { 0 },
		iteration = 0,
		minesPlaced = 0;

	std::string input = "";

	std::vector<unsigned short int> clearQue;

	bool show[9][9] = { false },
		flag[9][9] = { false };


	bool placeMine() {
		int y = rand() % height,
			x = rand() % width;

		if (grid[y][x] != 9) {
			minesPlaced++;

			// progress
			console.log("placed mine on " +
				std::to_string(grid[y][x]) + std::string(6, ' ') +
				" (" + std::to_string(minesPlaced) + "/" + std::to_string(mines) + ")");

			grid[y][x] = 9;

			return true;
		} else {

			console.log("didn't place mine on " +
				std::to_string(grid[y][x]) +
				" (" + std::to_string(minesPlaced) + "/" + std::to_string(mines) + ")");

			return false;
		}
	}

	void placeAllMines() {
		while (minesPlaced < mines) {
			placeMine();
		}
	}

	std::vector<unsigned short int> neighbors(unsigned short int x, unsigned short int y) {
		int neigh[8][2] = {
			{-1, -1}, {0, -1}, {1, -1},
			{-1, 0}, /* {0, 0}, */ {1, 0},
			{-1, 1}, {0, 1}, {1, 1}
		};
		std::vector<unsigned short int> r;
		
		
		for (int i = 0; i < 8; i++) {
			int cy = neigh[i][0] + y,
				cx = neigh[i][1] + x;
			if (cy >= 0 && cy < height) {
				if (cx >= 0 && cx < width) {
					r.push_back(cx + cy * width);
				}
			}
		}

		return r;
	}

	unsigned short int getMinesAround(std::vector<unsigned short int> cells) {
		//std::vector<unsigned short int> &cells = *cellsP;

		int l = cells.size(),
			r = 0;

		for (int i = 0; i < l; i++) {
			unsigned short int 
				x = cells[i] % width,
				y = cells[i] / width;
			if (grid[y][x] == 9) {
				r++;
			}
		}
		return r;
	}

	void fillGrid() {
		for (unsigned short int y = 0; y < height; y++) {
			for (unsigned short int x = 0; x < width; x++) {
				unsigned short int *pCell = &grid[y][x];

				if (*pCell == 9) continue;

				*pCell = getMinesAround(neighbors(x, y));
			}
		}
	}

	void shiftClearQue() {
		clearQue.erase(clearQue.begin());
	}

	void addClearQue(std::vector<unsigned short int> e) {
		clearQue.insert(clearQue.end(), e.begin(), e.end());
	}

	void clearClearQue() {
		unsigned short int clearQueL = clearQue.size();
		while(clearQue.size() != 0) {
			unsigned short int 
				x = clearQue[0] % width,
				y = clearQue[0] / width;

			if (show[y][x] || flag[y][x]) {
				shiftClearQue();
			} else {
				show[y][x] = true;
				if (grid[y][x] == 0) {
					addClearQue(neighbors(x, y));
				}
			}
		}
	}

	bool submitUserInput(unsigned short int x, unsigned short int y, char f) {
		if (x >= width || y >= height) return false;

		if (f == 'p') {
			if (!flag[y][x]) {
				show[y][x] = true;
				if (grid[y][x] == 0) {
					// clear neighbors
					std::vector<short unsigned int> neigh = neighbors(x, y);
					addClearQue(neigh);
					clearClearQue();
				} else if(grid[y][x] == 9){
					return true;
				}
			} else {
				console.log("Invalid! Position is flagged");
			}
		} else if (f == 'f') {
			flag[y][x] ^= true;
		}
		return false;
	}

	bool checkWin() {
		for (unsigned int x = 0; x < width; x++) {
			for (unsigned int y = 0; y < height; y++) {
				if (grid[y][x] == 9) {
					if (show[y][x]) {
						return false;
					}
				} else {
					if (!show[y][x]) {
						return false;
					}
				}
			}
		}
		return true;
	}
public:
	int getIteration() {
		return this->iteration;
	}
	void printGrid(short int sx = -1, short int sy = -1, char sf = 'p', bool showAll = false) {
		console.clear();

		// make space
		std::cout << std::endl << std::string(4, ' ');

		for (unsigned short int x = 0; x < width; x++) {
			if (sx == x) {
				console.color(0xF1);
				std::cout << std::to_string(x)[0];
				console.color(0x0F);
			} else {
				std::cout << std::to_string(x)[0];
			}
			std::cout << ' ';
		}
		std::cout << std::endl << std::string(2, ' ') << std::string(2 + width * 2, '-') << std::endl;

		for (unsigned short int y = 0; y < height; y++) {
			bool ysel = sy == y;

			if (ysel) {
				console.color(0xF1);
				std::cout << std::to_string(y)[0];
				console.color(0x0F);
			} else {
				std::cout << std::to_string(y)[0];
			}
			std::cout << " | ";

			for (unsigned short int x = 0; x < width; x++) {

				bool xsel = sx == x;

				unsigned short int
					i = grid[y][x],
					j = show[y][x],
					k = flag[y][x];
				char out;

				if (j || showAll) {
					switch (i) {
					case 0:
						out = ' ';
						break;
					case 9:
						out = 'X';
						break;
					default:
						out = (char)i + 48;
					}
				} else {
					if (k) {
						out = 'F';
					} else {
						out = '.';
					}
				}

				if (xsel || ysel) {
					if (xsel && ysel) {
						console.color(0x0C);
						
						if (!j || i == 0) {
							if (sf == 'p') {
								out = 'O';
							}
							else {
								out = 'F';
							}
						}
					} else {
						console.color(0x0B);
					}
				}

				std::cout << out << " ";

				console.color(0x0F);
			}

			console.color(0x0F);
			
			std::cout << std::endl;
		}
	}
	bool getUserInput() {
		std::cin.clear();

		char key = _getch();
		bool sumbit = false;

		switch (key) {
		case 3:
			return false;
			break;
		case 8:
			if (input.length() > 0) {
				input.pop_back();
			}
			break;
		case 13:
			sumbit = true;
			break;
		default:
			input += (char)key;
		}

		short int splitAt = input.find(' '),
			inputLength = input.length(),
			inX = -1,
			inY = -1;
		char flag = 'p';

		if (inputLength == 0) {
			
		} else if (splitAt < 0) {

			try {
				inX = std::stoi(input);
				if (inX >= width) {
					input.pop_back();
				}
			} catch (const std::exception&) {
				input.pop_back();
			}

		} else {

			std::string a[2] = {
				input.substr(0, splitAt),
				input.substr(splitAt + 1, inputLength)
			};

			short int splitA1At = a[1].find(' ');
			if (splitA1At > 0) {
				if (! (splitA1At + 1 == a[1].length()) ) {
					char tflag = a[1][splitA1At + 1];

					if (tflag == 'p' || tflag == 'f') {
						flag = tflag;
					} else {
						input.pop_back();
					}
				}

				a[1] = a[1].substr(0, splitA1At);
			}

			try {
				inX = std::stoi(a[0]);
				if (a[1].length() > 0) {
					inY = std::stoi(a[1]);
				}
				if (inY >= height) {
					input.pop_back();
				}
			} catch (const std::exception&) {
				input.pop_back();
			}

		}

		if (sumbit) {
			bool lose = submitUserInput(inX, inY, flag);
			input = "";
			if (lose) {
				printGrid(inX, inY, flag, true);
				console.log("YOU LOST :(");
				return false;
			} else {
				printGrid();
			}

			if (checkWin()) {
				printGrid();
				console.log("YOU WIN!!");
				return false;
			}
		} else {
			printGrid(inX, inY, flag);
		}

		std::cout << input;

		return true;
	}
	Game() {
		placeAllMines();
		fillGrid();
	}
};

int main()
{
	console.color(0xA0);
	console.log("C++Sweeper by JaPNaA. Visit https://japnaa.github.io/\n");

	console.color(0xF0);
	unsigned long long int seed = std::chrono::duration_cast<std::chrono::milliseconds>(
		std::chrono::system_clock::now().time_since_epoch()
		).count();
	srand((unsigned int)seed);
	console.log("Randomization seed: " + std::to_string(seed));

	console.color(0x0F);

	Game game;

	console.log("Ready!\n\nTo play type the coordinats in this format: x y\nThen press enter to reveal time\nPress any key to start...");
	_getch();

	game.printGrid();
	while(true){
		if(!game.getUserInput()) {
			break;
		}
	}

	unsigned long long int now = std::chrono::duration_cast<std::chrono::milliseconds>(
		std::chrono::system_clock::now().time_since_epoch()
		).count();

	std::cout << "Elapsed time: " << ((double)now - (double)seed) / 1000 <<  " seconds." << std::endl;

	console.log("\nPress enter to quit, you cannot not quit.");
	std::cin.clear();
	std::getchar();
    return 0;
}