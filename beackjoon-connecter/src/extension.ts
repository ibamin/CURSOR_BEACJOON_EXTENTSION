// 'vscode' 모듈은 VS Code 확장성 API를 포함하고 있습니다
// 아래 코드에서 vscode 별칭으로 모듈을 가져와서 사용하세요
import * as vscode from 'vscode';
import axios from 'axios';
import * as cheerio from 'cheerio';

// 트리 아이템 타입 정의
enum BaekjoonItemType {
	Category,
	Problem
}

// 트리 아이템 클래스 정의
class BaekjoonTreeItem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
		this.iconPath = collapsibleState === vscode.TreeItemCollapsibleState.None
			? new vscode.ThemeIcon('file')
			: new vscode.ThemeIcon('folder');
	}
}

interface Problem {
	id: string;
	title: string;
	level?: string;
}

// 트리 뷰 프로바이더 클래스 정의
class BaekjoonTreeDataProvider implements vscode.TreeDataProvider<BaekjoonTreeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<BaekjoonTreeItem | undefined | null | void> = new vscode.EventEmitter<BaekjoonTreeItem | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<BaekjoonTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

	private problemCache: Map<string, Problem[]> = new Map();

	// 트리 데이터 새로고침
	refresh(): void {
		this.problemCache.clear();
		this._onDidChangeTreeData.fire();
	}

	// 트리 아이템 가져오기
	getTreeItem(element: BaekjoonTreeItem): vscode.TreeItem {
		return element;
	}

	async getStepProblems(step: string): Promise<Problem[]> {
		if (this.problemCache.has(step)) {
			return this.problemCache.get(step)!;
		}

		try {
			const response = await axios.get(`https://www.acmicpc.net/step/${step}`, {
				headers: {
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
				}
			});
			const $ = cheerio.load(response.data);
			const problems: Problem[] = [];

			$('table.table > tbody > tr').each((_, elem) => {
				const id = $(elem).find('td:nth-child(2)').text().trim();
				const title = $(elem).find('td:nth-child(3) > a').text().trim();
				const level = $(elem).find('td:nth-child(4)').text().trim();
				if (id && title) {
					problems.push({ id, title, level });
				}
			});

			this.problemCache.set(step, problems);
			return problems;
		} catch (error) {
			console.error(`Error fetching problems for step ${step}:`, error);
			return [];
		}
	}

	async getAlgorithmProblems(category: string): Promise<Problem[]> {
		const categoryMap: { [key: string]: number } = {
			'구현': 102,
			'다이나믹 프로그래밍': 25,
			'그래프 이론': 7,
			'자료 구조': 175,
			'문자열': 158,
			'그리디 알고리즘': 33,
			'브루트포스 알고리즘': 125,
			'수학': 124,
			'정렬': 97,
			'이분 탐색': 12,
			'기하학': 100,
			'정수론': 95,
			'트리': 120,
			'사칙연산': 699,
			'시뮬레이션': 141,
			'DFS': 127,
			'BFS': 126,
			'백트래킹': 5,
			'분할 정복': 24,
			'스택': 71,
			'큐': 72,
			'우선순위 큐': 59,
			'해시를 사용한 집합과 맵': 136
		};

		const categoryId = categoryMap[category];
		if (categoryId === undefined) {
			return [];
		}

		try {
			const response = await axios.get(`https://www.acmicpc.net/problemset?sort=ac_desc&algo=${categoryId}&page=1`, {
				headers: {
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
				}
			});
			const $ = cheerio.load(response.data);
			const problems: Problem[] = [];

			$('#problemset > tbody > tr').each((_, elem) => {
				const $row = $(elem);
				const id = $row.find('td:nth-child(1)').text().trim();
				const title = $row.find('td:nth-child(2) > a').text().trim();
				const level = $row.find('td:nth-child(4)').text().trim();
				
				if (id && title) {
					problems.push({ id, title, level });
				}
			});

			return problems.slice(0, 50); // 상위 50개 문제만 반환
		} catch (error) {
			console.error(`Error fetching problems for category ${category}:`, error);
			return [];
		}
	}

	// 자식 요소 가져오기
	async getChildren(element?: BaekjoonTreeItem): Promise<BaekjoonTreeItem[]> {
		if (!element) {
			return [
				new BaekjoonTreeItem('단계별로 풀어보기', vscode.TreeItemCollapsibleState.Collapsed),
				new BaekjoonTreeItem('알고리즘 분류', vscode.TreeItemCollapsibleState.Collapsed)
			];
		}

		switch (element.label) {
			case '단계별로 풀어보기':
				return [
					new BaekjoonTreeItem('1. 입출력과 사칙연산', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('2. 조건문', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('3. 반복문', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('4. 1차원 배열', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('5. 문자열', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('6. 심화 1', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('7. 2차원 배열', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('8. 일반 수학 1', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('9. 약수, 배수와 소수', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('10. 기하: 직사각형과 삼각형', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('11. 시간 복잡도', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('12. 브루트 포스', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('13. 정렬', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('14. 집합과 맵', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('15. 약수, 배수와 소수 2', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('16. 스택, 큐, 덱', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('17. 조합론', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('18. 심화 2', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('19. 재귀', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('20. 백트래킹', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('21. 동적 계획법 1', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('22. 누적 합', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('23. 그리디 알고리즘', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('24. 분할 정복', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('25. 이분 탐색', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('26. 우선순위 큐', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('27. 동적 계획법 2', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('28. DFS와 BFS', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('29. 최단 경로', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('30. 투 포인터', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('31. 동적 계획법과 최단거리 역추적', vscode.TreeItemCollapsibleState.Collapsed)
				];
			case '알고리즘 분류':
				return [
					new BaekjoonTreeItem('구현', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('다이나믹 프로그래밍', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('그래프 이론', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('자료 구조', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('문자열', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('그리디 알고리즘', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('브루트포스 알고리즘', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('수학', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('정렬', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('이분 탐색', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('기하학', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('정수론', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('트리', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('사칙연산', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('시뮬레이션', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('DFS', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('BFS', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('백트래킹', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('분할 정복', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('스택', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('큐', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('우선순위 큐', vscode.TreeItemCollapsibleState.Collapsed),
					new BaekjoonTreeItem('해시를 사용한 집합과 맵', vscode.TreeItemCollapsibleState.Collapsed)
				];
			default:
				// 단계별 문제 목록
				const stepMatch = element.label.match(/^(\d+)\./);
				if (stepMatch) {
					const stepNumber = stepMatch[1];
					const problems = await this.getStepProblems(stepNumber);
					return problems.map(problem => 
						new BaekjoonTreeItem(`${problem.title} (${problem.id}번)`, vscode.TreeItemCollapsibleState.None, {
							command: 'baekjoon.openProblem',
							title: '문제 열기',
							arguments: [problem.id]
						})
					);
				}

				// 알고리즘 분류 문제 목록
				const problems = await this.getAlgorithmProblems(element.label);
				return problems.map(problem => 
					new BaekjoonTreeItem(`${problem.title} (${problem.id}번)`, vscode.TreeItemCollapsibleState.None, {
						command: 'baekjoon.openProblem',
						title: '문제 열기',
						arguments: [problem.id]
					})
				);
		}
	}
}

// 문제를 보여주는 에디터 추적
let problemEditor: vscode.TextEditor | undefined;

// 이 메서드는 확장 프로그램이 활성화될 때 호출됩니다
export function activate(context: vscode.ExtensionContext) {
	console.log('백준 문제 탐색기가 활성화되었습니다.');

	const treeDataProvider = new BaekjoonTreeDataProvider();
	vscode.window.registerTreeDataProvider('baekjoonExplorer', treeDataProvider);

	// 문제 내용을 가져오는 함수
	async function fetchProblemContent(problemId: string): Promise<string> {
		try {
			const response = await axios.get(`https://www.acmicpc.net/problem/${problemId}`, {
				headers: {
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
				}
			});
			const $ = cheerio.load(response.data);
			
			// 문제 정보 추출
			const title = $('#problem_title').text().trim();
			const description = $('#problem_description').html() || '';
			const input = $('#problem_input').html() || '';
			const output = $('#problem_output').html() || '';
			const sampleInputs = $('.sample-input').map((_, el) => $(el).text().trim()).get();
			const sampleOutputs = $('.sample-output').map((_, el) => $(el).text().trim()).get();
			
			// 마크다운 형식으로 변환
			let markdown = `# ${title}\n\n`;
			markdown += `## 문제\n${description}\n\n`;
			markdown += `## 입력\n${input}\n\n`;
			markdown += `## 출력\n${output}\n\n`;
			
			// 예제 입출력 추가
			for (let i = 0; i < sampleInputs.length; i++) {
				markdown += `## 예제 입력 ${i + 1}\n\`\`\`\n${sampleInputs[i]}\n\`\`\`\n\n`;
				markdown += `## 예제 출력 ${i + 1}\n\`\`\`\n${sampleOutputs[i]}\n\`\`\`\n\n`;
			}
			
			return markdown;
		} catch (error) {
			console.error('Error fetching problem:', error);
			return '문제를 불러오는 중 오류가 발생했습니다.';
		}
	}

	context.subscriptions.push(
		vscode.commands.registerCommand('baekjoon.refresh', () => {
			treeDataProvider.refresh();
			vscode.window.showInformationMessage('백준 문제 목록을 새로고침했습니다.');
		}),
		vscode.commands.registerCommand('baekjoon.openProblem', async (problemId: string) => {
			try {
				// 문제 내용 가져오기
				const content = await fetchProblemContent(problemId);
				
				if (!problemEditor || problemEditor.document.isClosed) {
					// 새 문서 생성
					const doc = await vscode.workspace.openTextDocument({
						content: content,
						language: 'markdown'
					});
					
					// 문서를 편집기에서 열기
					problemEditor = await vscode.window.showTextDocument(doc, {
						preview: false,
						viewColumn: vscode.ViewColumn.Beside
					});
				} else {
					// 기존 문서 내용 교체
					const edit = new vscode.WorkspaceEdit();
					const fullRange = new vscode.Range(
						problemEditor.document.positionAt(0),
						problemEditor.document.positionAt(problemEditor.document.getText().length)
					);
					edit.replace(problemEditor.document.uri, fullRange, content);
					await vscode.workspace.applyEdit(edit);
					
					// 에디터 포커스
					await vscode.window.showTextDocument(problemEditor.document, {
						preview: false,
						viewColumn: problemEditor.viewColumn
					});
				}
			} catch (error) {
				console.error('Error opening problem:', error);
				vscode.window.showErrorMessage('문제를 여는 중 오류가 발생했습니다.');
			}
		})
	);
}

export function deactivate() {}
