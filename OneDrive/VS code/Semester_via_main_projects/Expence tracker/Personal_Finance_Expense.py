import datetime
import os
import json
import streamlit as st

JSON_FILE = "Personal_Finance_Expense.json"
TXT_FILE = "Personal_Finance_Expense.txt"

class whole_processor:
    def menu(self):
        print("\n1. Add Income")
        print("2. Add Expense")
        print("3. View Summary")
        print("4. Exit")

    def _ensure_json(self, filename):
        if not os.path.exists(filename):
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump([], f, indent=2)

    def _load_data(self, filename):
        self._ensure_json(filename)
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return []

    def _save_data(self, filename, data):
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def _migrate_from_txt(self, txtfile, jsonfile):
        if not os.path.exists(txtfile):
            return
        entries = []
        try:
            with open(txtfile, 'r', encoding='utf-8') as f:
                lines = f.readlines()
        except IOError:
            return
        for line in lines[1:]:
            parts = line.strip().split("\t")
            if len(parts) < 4:
                continue
            typ = parts[0].strip()
            cat = parts[1].strip()
            dt = parts[2].strip()
            try:
                amt = float(parts[3])
            except ValueError:
                continue
            entries.append({"type": typ, "category": cat, "datetime": dt, "amount": amt})
        if entries:
            data = self._load_data(jsonfile)
            data.extend(entries)
            self._save_data(jsonfile, data)

    def _ensure_header(self, filename):
        if not os.path.exists(filename) or os.path.getsize(filename) == 0:
            with open(filename, "a", encoding="utf-8") as f:
                f.write("Type\tCategory\tDate&Time\tAmount\n")

    def income(self):
        jsonfile = JSON_FILE
        txtfile = TXT_FILE
        self._migrate_from_txt(txtfile, jsonfile)
        Category = input("\nEnter Category: ").strip()
        if not Category:
            print("Category cannot be empty.")
            return
        dateTime = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        try:
            incomeAmount = float(input("\nEnter Income: "))
            if incomeAmount < 0:
                print("Amount cannot be negative.")
                return
        except ValueError:
            print("Invalid amount — please enter a number.")
            return
        entry = {"type": "Income", "category": Category, "datetime": dateTime, "amount": incomeAmount}
        data = self._load_data(jsonfile)
        data.append(entry)
        self._save_data(jsonfile, data)

    def expense(self):
        jsonfile = JSON_FILE
        txtfile = TXT_FILE
        self._migrate_from_txt(txtfile, jsonfile)
        Category = input("\nEnter Category: ").strip()
        if not Category:
            print("Category cannot be empty.")
            return
        dateTime = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        try:
            expenseAmount = float(input("\nEnter Expense: "))
            if expenseAmount < 0:
                print("Amount cannot be negative.")
                return
        except ValueError:
            print("Invalid amount — please enter a number.")
            return
        entry = {"type": "Expense", "category": Category, "datetime": dateTime, "amount": expenseAmount}
        data = self._load_data(jsonfile)
        data.append(entry)
        self._save_data(jsonfile, data)

    def summary(self):
        jsonfile = JSON_FILE
        txtfile = TXT_FILE
        self._migrate_from_txt(txtfile, jsonfile)
        data = self._load_data(jsonfile)
        if not data:
            print("No records found.")
            return
        total_income = 0.0
        total_expense = 0.0
        for item in data:
            typ = str(item.get("type", "")).strip().lower()
            try:
                amount = float(item.get("amount", 0))
            except (TypeError, ValueError):
                continue
            if typ == "income":
                total_income += amount
            elif typ == "expense":
                total_expense += amount
        balance = total_income - total_expense
        print(f"\nTotal Income: {total_income}")
        print(f"Total Expense: {total_expense}")
        print(f"Balance: {balance}\n")


def add_record(record_type, category, amount):
    processor = whole_processor()
    processor._migrate_from_txt(TXT_FILE, JSON_FILE)
    data = processor._load_data(JSON_FILE)
    data.append({
        "type": record_type,
        "category": category,
        "datetime": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "amount": float(amount),
    })
    processor._save_data(JSON_FILE, data)


def get_records():
    processor = whole_processor()
    processor._migrate_from_txt(TXT_FILE, JSON_FILE)
    return processor._load_data(JSON_FILE)


def calculate_totals(records):
    total_income = 0.0
    total_expense = 0.0
    for item in records:
        try:
            amount = float(item.get("amount", 0))
        except (TypeError, ValueError):
            continue
        record_type = str(item.get("type", "")).strip().lower()
        if record_type == "income":
            total_income += amount
        elif record_type == "expense":
            total_expense += amount
    return total_income, total_expense, total_income - total_expense


def run_streamlit_app():
    import streamlit as st

    st.set_page_config(page_title="Money Tracker", page_icon="💰", layout="wide")
    st.title("Money Tracker")

    records = get_records()
    total_income, total_expense, balance = calculate_totals(records)

    col1, col2, col3 = st.columns(3)
    col1.metric("Total Income", f"{total_income:.2f}")
    col2.metric("Total Expense", f"{total_expense:.2f}")
    col3.metric("Balance", f"{balance:.2f}")

    st.divider()

    with st.form("record_form", clear_on_submit=True):
        record_type = st.selectbox("Type", ["Income", "Expense"])
        category = st.text_input("Category")
        amount = st.number_input("Amount", min_value=0.0, step=1.0)
        submitted = st.form_submit_button("Add Record")

    if submitted:
        if not category.strip():
            st.error("Category cannot be empty.")
        elif amount <= 0:
            st.error("Amount must be greater than zero.")
        else:
            add_record(record_type, category.strip(), amount)
            st.success(f"{record_type} added.")
            st.rerun()

    st.subheader("Records")
    if records:
        st.dataframe(records, use_container_width=True, hide_index=True)
    else:
        st.info("No records found.")


def is_streamlit_running():
    try:
        from streamlit.runtime.scriptrunner import get_script_run_ctx
    except ImportError:
        return False
    return get_script_run_ctx() is not None


def main():
    print("Welcome to Your Money Tracker")
    o1 = whole_processor()
    while True:
        o1.menu()
        try:
            choice = int(input("\nEnter your Choice: "))
        except ValueError:
            print("Please enter a number between 1 and 4.")
            continue
        except (EOFError, KeyboardInterrupt):
            print("\nExiting. Goodbye.")
            break
        if choice == 1:
            o1.income()
        elif choice == 2:
            o1.expense()
        elif choice == 3:
            o1.summary()
        elif choice == 4:
            print("Thanks To Visit!")
            break
        else:
            print("Invalid choice. Try again.")


if __name__ == '__main__':
    if is_streamlit_running():
        run_streamlit_app()
    else:
        main()
