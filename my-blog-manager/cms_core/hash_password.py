"""
密码哈希生成工具
================
用法：
    cd my-blog-manager
    python -m cms_core.hash_password
    或者：
    python -c "import bcrypt; print(bcrypt.hashpw(b'你的密码', bcrypt.gensalt()).decode())"

请把输出的哈希值写入 .env 文件的 CMS_ADMIN_PASSWORD_HASH 字段。
"""

import bcrypt


def main():
    import getpass
    pwd = getpass.getpass("请输入要哈希的密码（不会回显）：")
    if not pwd:
        print("❌ 密码不能为空")
        return
    hashed = bcrypt.hashpw(pwd.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    print("\n=== 生成的 bcrypt 哈希（请粘贴到 .env 的 CMS_ADMIN_PASSWORD_HASH） ===")
    print(hashed)
    print("\n⚠️  请妥善保管此哈希值，切勿提交到版本库。")


if __name__ == "__main__":
    main()
