import os

def rename_sprites(directory, suffix):
    if not os.path.exists(directory):
        print(f"Directory not found: {directory}")
        return

    count = 0
    for filename in os.listdir(directory):
        # Skip files that already have the suffix to avoid double-renaming
        if f"_{suffix}" in filename:
            continue
            
        name, ext = os.path.splitext(filename)
        
        # Only process standard image files
        if ext.lower() not in ['.png', '.jpg', '.jpeg', '.gif', '.webp']:
            continue

        new_name = f"{name}_{suffix}{ext}"
        old_path = os.path.join(directory, filename)
        new_path = os.path.join(directory, new_name)
        
        os.rename(old_path, new_path)
        count += 1
        
    print(f"Successfully renamed {count} images in {directory}")

# Your exact directories
front_dir = r"D:\GitHub\web3 creature collector\wait\shiny_front"
back_dir = r"D:\GitHub\web3 creature collector\wait\shiny_back"

print("Renaming front sprites...")
rename_sprites(front_dir, "front")

print("\nRenaming back sprites...")
rename_sprites(back_dir, "back")

print("\nAll done!")